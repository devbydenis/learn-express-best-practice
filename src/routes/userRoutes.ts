import express, { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

// ============================================
// IN-MEMORY DATA (untuk demo)
// ============================================

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

let users: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', createdAt: new Date() },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date() }
];

// ============================================
// ROUTES
// ============================================

/**
 * GET /users - Get all users
 */
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Query parameters
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;

  // Filter users
  let filteredUsers = [...users];
  if (search) {
    filteredUsers = users.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedUsers,
    pagination: {
      page,
      limit,
      total: filteredUsers.length,
      totalPages: Math.ceil(filteredUsers.length / limit)
    }
  });
}));

/**
 * GET /users/:id - Get user by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id as string);

  // Validation
  if (isNaN(id)) {
    res.status(400).json({
      success: false,
      error: 'Invalid user ID'
    });
    return;
  }

  const user = users.find(u => u.id === id);

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
}));

/**
 * POST /users - Create new user
 */
router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email } = req.body;

  // Validation
  if (!name || !email) {
    res.status(400).json({
      success: false,
      error: 'Name and email are required'
    });
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
    return;
  }

  // Check duplicate email
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    res.status(409).json({
      success: false,
      error: 'Email already exists'
    });
    return;
  }

  // Create user
  const newUser: User = {
    id: users.length + 1,
    name,
    email,
    createdAt: new Date()
  };

  users.push(newUser);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: newUser
  });
}));

/**
 * PUT /users/:id - Update user
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const { name, email } = req.body;

  // Validation
  if (isNaN(id)) {
    res.status(400).json({
      success: false,
      error: 'Invalid user ID'
    });
    return;
  }

  const userIndex = users.findIndex(u => u.id === id);

  if (userIndex === -1) {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  // Update fields (partial update)
  if (name) users[userIndex].name = name;
  if (email) {
    // Check duplicate email
    const existingUser = users.find(u => u.email === email && u.id !== id);
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'Email already exists'
      });
      return;
    }
    users[userIndex].email = email;
  }

  res.json({
    success: true,
    message: 'User updated successfully',
    data: users[userIndex]
  });
}));

/**
 * DELETE /users/:id - Delete user
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id as string);

  if (isNaN(id)) {
    res.status(400).json({
      success: false,
      error: 'Invalid user ID'
    });
    return;
  }

  const userIndex = users.findIndex(u => u.id === id);

  if (userIndex === -1) {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  users.splice(userIndex, 1);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

export default router;
