import { IsEmail, IsNotEmpty, IsOptional, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsEmail({}, { message: 'Dogry email adresi giriziň' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Parol iň az 6 simwol bolmaly' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'At we familiýa hökmany' })
  fullName!: string;
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}