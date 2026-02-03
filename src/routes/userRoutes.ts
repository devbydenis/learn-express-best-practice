import express, { Request, Response } from 'express';
import prisma from '../config/database';
import { validate, createUserSchema, updateUserSchema } from '../validators/userValidator';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * CREATE - Insert user baru
 * POST /users
 */
router.post('/', validate(createUserSchema), asyncHandler(async (req: Request, res: Response) => {
  const { email, name, password } = req.body;

  // Basic validation
  if (!email || !name || !password) {
    res.status(400).json({
      success: false,
      error: 'Email, name, and password are required'
    });
    return 
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
    return 
  }

  // Insert ke database (error auto-handled oleh errorHandler middleware)
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password  // Di bagian auth nanti akan di-hash
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true
      // password: false - jangan return password!
    }
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: user
  });
}));

/**
 * READ - Get all users
 * GET /users
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  // Query parameters untuk pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Get users dengan pagination
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: { posts: true }  // Count posts
        }
      },
      orderBy: {
        createdAt: 'desc'  // Newest first
      }
    }),
    prisma.user.count()  // Total count untuk pagination
  ]);

  res.json({
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}));

/**
 * READ - Get single user by ID
 * GET /users/:id
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  // Validate ID
  if (isNaN(id)) {
    res.status(400).json({
      success: false,
      error: 'Invalid user ID'
    });
    return 
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      posts: {
        select: {
          id: true,
          title: true,
          published: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!user) {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
    return 
  }

  res.json({
    success: true,
    data: user
  });
}));

/**
 * UPDATE - Update user
 * PUT /users/:id
 */
router.put('/:id', validate(updateUserSchema), asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { email, name } = req.body;

  // Validate ID
  if (isNaN(id)) {
    res.status(400).json({
      success: false,
      error: 'Invalid user ID'
    });
    return 
  }

  // Prepare update data (only include provided fields)
  const updateData: { email?: string; name?: string } = {};
  if (email) updateData.email = email;
  if (name) updateData.name = name;

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({
      success: false,
      error: 'No fields to update'
    });
    return;
  }

  // Update user (P2025 error jika user tidak ada akan di-handle oleh errorHandler)
  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      updatedAt: true
    }
  });

  res.json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
}));

/**
 * DELETE - Delete user
 * DELETE /users/:id
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  // Validate ID
  if (isNaN(id)) {
    res.status(400).json({
      success: false,
      error: 'Invalid user ID'
    });
    return 
  }

  // Delete user (cascade akan hapus posts juga)
  await prisma.user.delete({
    where: { id }
  });

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));


/**
 * GET /users/profile - Get current user profile
 * Protected route - requires authentication
 */
router.get(
  '/profile',
  authMiddleware,  // Require auth
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;  // From authMiddleware

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        posts: {
          select: {
            id: true,
            title: true,
            published: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  })
);

/**
 * PUT /users/profile - Update current user profile
 * Protected route
 */
router.put(
  '/profile',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { name } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        error: 'Name is required'
      });
      return;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name },
      select: {
        id: true,
        email: true,
        name: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  })
);


export default router;
