import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Dogry email adresi giriziň' })
  email!: string;

  @IsString()
  password!: string;
}