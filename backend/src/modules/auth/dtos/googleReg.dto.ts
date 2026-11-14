import { IsEmail, IsString } from 'class-validator'

export class googleRegDto {
  @IsString()
  @IsEmail()
  email!: string

  @IsString()
  firstName!: string

  @IsString()
  lastName!: string
}
