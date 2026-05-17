import { IsOptional, IsString, MaxLength } from 'class-validator';

export class JoinRoomParticipantDto {
  @IsOptional()
  @IsString()
  @MaxLength(8)
  password?: string;
}
