import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequestTypeService } from '../request-type/request-type.service';
import { ChatMessageInput } from './dto/chat.input';
import { RequestType } from '../request-type/entities/request-type.entity';

export interface AssistantChatResult {
  message: string;
  recommendedFormId?: string | null;
  recommendedFormName?: string | null;
  status: number;
}

interface FormCatalogEntry {
  id: string;
  name: string;
  description: string;
  stepsSummary: string;
}

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly requestTypeService: RequestTypeService,
    private readonly configService: ConfigService,
  ) {}

  async chat(messages: ChatMessageInput[]): Promise<AssistantChatResult> {
    const { requestTypes } =
      await this.requestTypeService.getAllRequestTypes();

    if (!requestTypes?.length) {
      return {
        status: 200,
        message:
          'No forms are available yet. Please contact an administrator.',
        recommendedFormId: null,
        recommendedFormName: null,
      };
    }

    const catalog = this.buildFormCatalog(requestTypes);
    const systemPrompt = this.buildSystemPrompt(catalog);

    try {
      const rawContent = await this.callOllama(systemPrompt, messages);
      const parsed = this.parseAssistantResponse(rawContent, requestTypes);

      return {
        status: 200,
        message: parsed.message,
        recommendedFormId: parsed.recommendedFormId,
        recommendedFormName: parsed.recommendedFormName,
      };
    } catch (error) {
      this.logger.error('Ollama assistant error', error);

      return {
        status: 503,
        message:
          'Your agent Platform_Helper is temporarily unavailable. Wake up Ollama locally, then try again.',
        recommendedFormId: null,
        recommendedFormName: null,
      };
    }
  }

  private buildFormCatalog(requestTypes: RequestType[]): FormCatalogEntry[] {
    return requestTypes.map((requestType) => ({
      id: String(requestType._id),
      name: requestType.name,
      description: requestType.description || 'No description provided.',
      stepsSummary: this.summarizeSteps(requestType.steps),
    }));
  }

  private summarizeSteps(stepsJson?: string): string {
    if (!stepsJson) return 'No step details available.';

    try {
      const steps = JSON.parse(stepsJson) as Array<{
        name?: string;
        elements?: Array<{ label?: string; type?: string }>;
      }>;

      if (!Array.isArray(steps) || steps.length === 0) {
        return 'No step details available.';
      }

      return steps
        .map((step, index) => {
          const stepName = step.name || `Step ${index + 1}`;
          const fields =
            step.elements
              ?.map((element) => element.label || element.type)
              .filter(Boolean)
              .join(', ') || 'no fields';

          return `${stepName}: ${fields}`;
        })
        .join(' | ');
    } catch {
      return 'Step structure could not be parsed.';
    }
  }

  private buildSystemPrompt(catalog: FormCatalogEntry[]): string {
    return `You are the FormPlatform assistant. You help students choose the correct administrative form.

Available forms (use only these IDs and names):
${JSON.stringify(catalog, null, 2)}

Rules:
- Ask short, clear follow-up questions until you understand the student's situation.
- Recommend only forms from the list above.
- When you are ready to recommend a form, set recommendedFormId and recommendedFormName to exact values from the list.
- If no form fits, keep recommendedFormId and recommendedFormName as null and explain why.
- Reply with JSON only, no markdown, using this shape:
{"message":"your reply to the student","recommendedFormId":null,"recommendedFormName":null}`;
  }

  private async callOllama(
    systemPrompt: string,
    messages: ChatMessageInput[],
  ): Promise<string> {
    const baseUrl = this.configService.get<string>(
      'OLLAMA_BASE_URL',
      'http://localhost:11434',
    );
    const model = this.configService.get<string>('OLLAMA_MODEL', 'llama3.2');

    const ollamaMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ];

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: ollamaMessages,
        stream: false,
        format: 'json',
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed with status ${response.status}`);
    }

    const data = (await response.json()) as {
      message?: { content?: string };
    };

    const content = data.message?.content?.trim();

    if (!content) {
      throw new Error('Ollama returned an empty response');
    }

    return content;
  }

  private parseAssistantResponse(
    rawContent: string,
    requestTypes: RequestType[],
  ): {
    message: string;
    recommendedFormId: string | null;
    recommendedFormName: string | null;
  } {
    try {
      const parsed = JSON.parse(rawContent) as {
        message?: string;
        recommendedFormId?: string | null;
        recommendedFormName?: string | null;
      };

      const message =
        parsed.message?.trim() ||
        'I could not generate a helpful answer. Please try again.';

      if (!parsed.recommendedFormId) {
        return {
          message,
          recommendedFormId: null,
          recommendedFormName: null,
        };
      }

      const matchedForm = requestTypes.find(
        (requestType) => String(requestType._id) === parsed.recommendedFormId,
      );

      if (!matchedForm) {
        return {
          message,
          recommendedFormId: null,
          recommendedFormName: null,
        };
      }

      return {
        message,
        recommendedFormId: String(matchedForm._id),
        recommendedFormName: matchedForm.name,
      };
    } catch {
      return {
        message: rawContent,
        recommendedFormId: null,
        recommendedFormName: null,
      };
    }
  }
}
