import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../guards';
import { handleFileUpload } from '../common';
import { Response } from 'express';
import { Multer } from 'multer';

@Controller('upload')
export class UploadController {
  @UseGuards(AuthGuard)
  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Multer.File, @Res() res: Response) {
    try {
      if (!file) {
        return res.status(400).send({
          status: 400,
          message: 'FILE_REQUIRED',
          url: null,
        });
      }

      const filePath = await handleFileUpload(file, 'demandes');
      const fileUrl = `/${filePath}`;

      return res.status(200).send({
        status: 200,
        message: 'FILE_UPLOADED_SUCCESSFULLY',
        url: fileUrl,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).send({
        status: 500,
        message: 'FILE_UPLOAD_FAILED',
        url: null,
      });
    }
  }
}
