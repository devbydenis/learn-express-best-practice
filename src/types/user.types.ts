/**
 * User entity (database model)
 */
export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User response (without sensitive data)
 */
export interface UserResponse {
  id: number;
  email: string;
  name: string;
  createdAt: Date;
}

/**
 * DTO (Data Transfer Objects)
 */
export interface CreateUserDTO {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserDTO {
  email?: string;
  name?: string;
  password?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface ChangePasswordDTO {
  oldPassword: string;
  newPassword: string;
}

/**
 * Service responses
 */
export interface AuthResponse {
  user: UserResponse;
  token: string;
}

/**
 * JWT Payload
 */
export interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}
