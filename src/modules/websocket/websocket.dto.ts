import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

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

// Terminal DTOs
export class CreateTerminalDto {
  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(200)
  cols?: number;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(100)
  rows?: number;

  @IsOptional()
  @IsString()
  shell?: string;
}

export class TerminalInputDto {
  @IsString()
  terminalId!: string;

  @IsString()
  input!: string;
}

export class TerminalResizeDto {
  @IsString()
  terminalId!: string;

  @IsInt()
  @Min(20)
  @Max(200)
  cols!: number;

  @IsInt()
  @Min(5)
  @Max(100)
  rows!: number;
}
