import { AbstractDocument, ERole } from '../../common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  versionKey: false,
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class User extends AbstractDocument {
  @Prop()
  email?: string;

  @Prop()
  photo?: string;

  @Prop()
  phone?: string;

  @Prop()
  fullname?: string;

  @Prop({ enum: ERole, type: String })
  role: ERole;

  @Prop({ default: false })
  isBlocked: boolean;

  @Prop({ nullable: true })
  otp_code?: string;

  @Prop({ nullable: true })
  otp_expires_at?: Date;

  @Prop({ nullable: true })
  otp_confirmation_token?: string;

  @Prop()
  address?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
