import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class SendNotificationDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsEnum(['info', 'success', 'warning', 'error'])
  type?: 'info' | 'success' | 'warning' | 'error';
}

export class SendUserNotificationDto extends SendNotificationDto {
  @IsNumber()
  userId!: number;
}

export class SendRoomNotificationDto extends SendNotificationDto {
  @IsString()
  room!: string;
}
