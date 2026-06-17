import { AbstractDocument } from '../../common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ERequestStatus } from '../../common/enums';
import { Types } from 'mongoose';

@Schema({
  versionKey: false,
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class Request extends AbstractDocument {
  @Prop({ unique: true, required: true })
  reference: string;

  @Prop({ required: true })
  title: string;

  @Prop({ enum: ERequestStatus, default: ERequestStatus.DRAFT, type: String })
  status: ERequestStatus;

  @Prop({ type: Types.ObjectId, ref: 'RequestType', required: true })
  requestTypeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop()
  steps?: string;
}

export const RequestSchema = SchemaFactory.createForClass(Request);
