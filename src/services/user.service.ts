import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import {
  User,
  UserResponse,
  CreateUserDTO,
  UpdateUserDTO,
  AuthResponse,
  LoginDTO
} from '../types/user.types';
import { generateToken } from '../utils/jwt';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { config } from '../config/env';
import logger from '../config/logger';

/**
 * User Service
 * Contains all business logic for user operations
 */
export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Register new user
   */
  async register(data: CreateUserDTO): Promise<AuthResponse> {
    logger.info('Registering new user', { email: data.email });

    // Check if email already exists
    const emailExists = await this.userRepository.emailExists(data.email);
    if (emailExists) {
      throw new ConflictError('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, config.bcrypt.rounds);

    // Create user
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    logger.info('User registered successfully', { userId: user.id });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginDTO): Promise<AuthResponse> {
    logger.info('User login attempt', { email: data.email });

    // Find user
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    logger.info('User logged in successfully', { userId: user.id });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Get all users with pagination
   */
  async getAllUsers(page: number, limit: number): Promise<{
    users: UserResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { users, total } = await this.userRepository.findAll(page, limit);

    return {
      users: users.map(u => this.sanitizeUser(u)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<UserResponse> {
    const user = await this.userRepository.getById(id);
    return this.sanitizeUser(user);
  }

  /**
   * Update user
   */
  async updateUser(id: number, data: UpdateUserDTO): Promise<UserResponse> {
    logger.info('Updating user', { userId: id });

    // Check email conflict if updating email
    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictError('Email already exists');
      }
    }

    const user = await this.userRepository.update(id, data);

    logger.info('User updated successfully', { userId: id });

    return this.sanitizeUser(user);
  }

  /**
   * Delete user
   */
  async deleteUser(id: number): Promise<void> {
    logger.info('Deleting user', { userId: id });
    await this.userRepository.delete(id);
    logger.info('User deleted successfully', { userId: id });
  }

  /**
   * Remove password from user object
   */
  private sanitizeUser(user: User): UserResponse {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
