import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  password?: string;
}
