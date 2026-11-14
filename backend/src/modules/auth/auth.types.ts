import { Role } from "../../shared/types/types";

export interface RegisterDto {
   firstName: string;
   lastName: string;
   email: string;
   password: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface ResetPasswordDto {
  token: string
  newPassword: string
}

export interface AuthUserResponse {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: Role.USER;
    isAccountVerified: boolean;
    isActive: boolean;
    createdAt: Date;
}

export interface AuthResponse {
  accessToken: string
  user: AuthUserResponse
}

export interface GoogleProfile {
  emails: { value: string }[]
  name: { firstName: string; lastName: string }
}
