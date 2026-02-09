import { UserRepository } from "../repositories/user.repository";
import {
  UserResponse,
  UpdateUserDTO,
  CreateUserDTO,
} from "../types/user.types";
import { ConflictError } from "../utils/errors";
import logger from "../config/logger";

/**
 * User Service
 * Handles ONLY user management operations (CRUD)
 *
 * Responsibilities:
 * - Get users (list, single)
 * - Update user profile
 * - Delete user
 * - User-related business logic (NOT authentication)
 */
export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Create user
   *
   */

  async createUser(data: CreateUserDTO): Promise<UserResponse> {
    // check existing email
    const emailExist = await this.userRepository.emailExists(data.email);
    if (emailExist) {
      throw new ConflictError("Email already exists");
    }

    logger.info("Created user successfully", { email: data.email });

    const user = await this.userRepository.create(data);

    logger.info("Created user successfully", { userId: user.id });

    return user;
  }

  /**
   * Get all users with pagination
   */
  async getAllUsers(
    page: number,
    limit: number,
  ): Promise<{
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
      users,
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
    return this.userRepository.getById(id);
  }

  /**
   * Update user
   */
  async updateUser(id: number, data: UpdateUserDTO): Promise<UserResponse> {
    logger.info("Updating user", { userId: id });

    // Check email conflict if updating email
    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictError("Email already exists");
      }
    }

    const user = await this.userRepository.update(id, data);

    logger.info("User updated successfully", { userId: id });

    return user;
  }

  /**
   * Delete user
   */
  async deleteUser(id: number): Promise<void> {
    logger.info("Deleting user", { userId: id });

    await this.userRepository.delete(id);

    logger.info("User deleted successfully", { userId: id });
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string): Promise<UserResponse[]> {
    logger.debug("Searching users", { query });

    const users = await this.userRepository.search(query);
    return users;
  }
}
