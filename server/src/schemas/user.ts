export type UserType = 'admin' | 'owner' | 'member' | 'viewer' | string;

export interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
  password_hash: string;
  username: string;
  organization_id: string;
  created_at: Date;
  updated_at: Date | null;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  username: string;
  organization_id: string;
  created_at: Date;
  updated_at: Date | null;
  type: UserType;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  username: string;
  password: string;
  organization_id: string;
  type?: UserType;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  username?: string;
  password?: string;
  organization_id?: string;
  type?: UserType;
}

export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
}
