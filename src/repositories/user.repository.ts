import { Prisma } from "@prisma/client";
import prisma from "../config/database";
import {
  User,
  CreateUserDTO,
  UpdateUserDTO,
} from "../types/user.types";
import { NotFoundError } from "../utils/errors";

/**
 * User Repository
 * Handle semua operasi database untuk entity User
 */

export class UserRepository {
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      omit: { password: true }, // never return password
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });
  }

  /**
   * Get user by ID or throw
   */
  async getById(id: number): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }

  /**
   * Find all users with pagination
   */
  async findAll(page = 1, limit = 10): Promise<{ users: User[]; total: number }> {
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100);
    const skip = (validPage - 1) * validLimit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: validLimit,
        orderBy: { createdAt: "desc" },
        omit: { password: true },
      }),
      prisma.user.count(),
    ]);

    return { users, total };
  }

  /**
   * Create new user
   */
  async create(data: CreateUserDTO): Promise<User> {
    return prisma.user.create({ data });
  }

  /**
   * Update user
   */
  async update(id: number, data: UpdateUserDTO): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data,
        omit: { password: true }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundError("User not found");
      }
      throw error;
    }
  }

  /**
   * Delete user
   */
  async delete(id: number): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundError("User not found");
      }
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: { email },
      select: { id: true }, // only fetch id noto entire record
    });

    return !!user;
  }

  /**
   * Search users by name or email
   */
  async search(query: string, limit = 20): Promise<User[]> {
    const validLimit = Math.min(Math.max(1, limit), 100);

    return prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      take: validLimit,
      omit: { password: true }
    });
  }
}
