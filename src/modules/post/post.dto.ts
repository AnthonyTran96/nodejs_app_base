import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  title!: string;

  @IsNotEmpty({ message: 'Content is required' })
  @IsString({ message: 'Content must be a string' })
  @MaxLength(50000, { message: 'Content cannot exceed 50,000 characters' })
  content!: string;

  @IsNotEmpty({ message: 'Author ID is required' })
  @IsNumber({}, { message: 'Author ID must be a number' })
  @Min(1, { message: 'Author ID must be at least 1' })
  authorId!: number;

  @IsOptional()
  @IsBoolean({ message: 'Published status must be a boolean' })
  published?: boolean;
}

export class UpdatePostDto {
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  title!: string;

  @IsOptional()
  @IsString({ message: 'Content must be a string' })
  @MaxLength(50000, { message: 'Content cannot exceed 50,000 characters' })
  content!: string;

  @IsOptional()
  @IsBoolean({ message: 'Published status must be a boolean' })
  published?: boolean;
}

export class PostFilterQueryDto {
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @Transform(({ value }) => value?.trim())
  title?: string;

  @IsOptional()
  @IsString({ message: 'Content must be a string' })
  @Transform(({ value }) => value?.trim())
  content?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value; // Keep original value if not 'true' or 'false' for further validation
  })
  @IsBoolean({ message: 'Published status must be a boolean' })
  published?: boolean;

  @IsOptional()
  @IsString({ message: 'Author name must be a string' })
  @Transform(({ value }) => value?.trim())
  authorName?: string;
}
