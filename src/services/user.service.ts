import { UserRepository } from "../repositories/user.repository";
import { User, UserResponse, UpdateUserDTO } from "../types/user.types";
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
   * Remove password from user object
   */
  private sanitizeUser(user: User): UserResponse {
    const { password, ...sanitized } = user;
    return sanitized;
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
      users: users.map((u) => this.sanitizeUser(u)),
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

    return this.sanitizeUser(user);
  }

  /**
   * Delete user
   */
  async deleteUser(id: number): Promise<void> {
    logger.info("Deleting user", { userId: id });
    await this.userRepository.delete(id);
    logger.info("User deleted successfully", { userId: id });
  }
}
