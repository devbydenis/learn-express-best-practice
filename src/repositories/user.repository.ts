import prisma from '../config/database';
import { User, CreateUserDTO, UpdateUserDTO } from '../types/user.types';
import { NotFoundError } from '../utils/errors';

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
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { 
	      id: Number(id) 
	    },
    });
  }

  /**
   * Get user by ID or throw
   */
  async getById(id: number): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Find all users with pagination
   */
  async findAll(page = 1, limit = 10): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return { users, total };
  }

  /**
   * Create new user
   */
  async create(data: CreateUserDTO): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  /**
   * Update user
   */
  async update(id: number, data: UpdateUserDTO): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('User not found');
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
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('User not found');
      }
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email },
    });
    return count > 0;
  }
}
