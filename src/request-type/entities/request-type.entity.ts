import { AbstractDocument } from '../../common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  versionKey: false,
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class RequestType extends AbstractDocument {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  steps?: string;
}

export const RequestTypeSchema = SchemaFactory.createForClass(RequestType);
