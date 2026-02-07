import bcrypt from "bcrypt";
import { UserRepository } from "../repositories/user.repository";
import {
  User,
  UserResponse,
  CreateUserDTO,
  AuthResponse,
  LoginDTO,
} from "../types/user.types";
import { generateToken, verifyToken } from "../utils/jwt";
import { ConflictError, UnauthorizedError } from "../utils/errors";
import { config } from "../config/env";
import logger from "../config/logger";

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Remove password from user object
   */
  private sanitizeUser(user: User): UserResponse {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Register new user
   *
   * Steps:
   * 1. Validate email doesn't exist
   * 2. Hash password
   * 3. Create user in database
   * 4. Generate JWT token
   */
  async register(data: CreateUserDTO): Promise<AuthResponse> {
    logger.info("Registering new user", { email: data.email });

    // Check if email already exists
    const emailExists = await this.userRepository.emailExists(data.email);
    if (emailExists) {
      throw new ConflictError("Email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      data.password,
      config.bcrypt.rounds,
    );

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

    logger.info("User registered successfully", { userId: user.id });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Login user
   *
   * Steps:
   * 1. Find user by email
   * 2. Verify password
   * 3. Generate JWT token
   */
  async login(data: LoginDTO): Promise<AuthResponse> {
    logger.info("User login attempt", { email: data.email });

    // Find user
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Verify password
    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    logger.info("User logged in successfully", { userId: user.id });

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Verify token (optional - untuk refresh token)
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      const decoded = verifyToken(token);
      const user = await this.userRepository.findById(decoded.userId);
      return !!user;
    } catch (error) {
      return false;
    }
  }

  /**
   * Change password
   */
  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    logger.info("Changing password", { userId });

    // Get user
    const user = await this.userRepository.getById(userId);

    // Verify old password
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      throw new UnauthorizedError("Invalid old password");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.rounds);

    // Update password
    await this.userRepository.update(userId, { password: hashedPassword });

    logger.info("Password changed successfully", { userId });
  }
}
