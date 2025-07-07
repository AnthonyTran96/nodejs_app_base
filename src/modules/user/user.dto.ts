import { Role, getRoleValues } from '@/types/role.enum';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @Transform(({ value }) => value?.trim())
  name!: string;

  @IsOptional()
  @IsString({ message: 'Role must be a string' })
  @IsIn(getRoleValues(), { message: 'Role must be either user or admin' })
  role?: Role = Role.USER;
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsString({ message: 'Role must be a string' })
  @IsIn(getRoleValues(), { message: 'Role must be either user or admin' })
  role?: Role;
}

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  password!: string;
}

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Current password is required' })
  @IsString({ message: 'Current password must be a string' })
  currentPassword!: string;

  @IsNotEmpty({ message: 'New password is required' })
  @IsString({ message: 'New password must be a string' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword!: string;
}
