import { IsString, MaxLength, MinLength } from 'class-validator'

export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password!: string
}
