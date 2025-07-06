import { Role } from '@/types/role.enum';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  role?: Role;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserFilter {
  name?: string;
  role?: Role;
  email?: string;
}
