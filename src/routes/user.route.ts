import express from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  validate,
  createUserSchema,
  updateUserSchema,
} from "../validators/user.validator";
import { authMiddleware } from "../middleware/auth.middleware";
import { UserController } from "../controllers/user.controller";

const router = express.Router();
const userController = new UserController();

/**
 * GET /users/profile - Get current user profile
 * Protected route - requires authentication
 */
router.get(
  "/profile",
  authMiddleware, // Require auth to see profile
  asyncHandler(userController.getProfile),
);

/**
 * PUT /users/profile - Update current user profile
 * Protected route
 */
router.put(
  "/profile",
  authMiddleware, // required auth to update profile
  validate(updateUserSchema),
  asyncHandler(userController.updateProfile),
);

/**
 * CREATE - Insert user baru
 * POST /users
 */
router.post(
  "/",
  authMiddleware,
  validate(createUserSchema),
  asyncHandler(userController.createUser),
);

/**
 * READ - Get all users
 * GET /users
 */
router.get(
  "/",
  asyncHandler(userController.getAllUsers),
);

/**
 * READ - Get single user by ID
 * GET /users/:id
 */
router.get(
  "/:id",
  asyncHandler(userController.getUserById),
);

/**
 * UPDATE - Update user
 * PUT /users/:id
 */
router.put(
  "/:id",
  authMiddleware,
  validate(updateUserSchema),
  asyncHandler(userController.updateUser),
);

/**
 * DELETE - Delete user
 * DELETE /users/:id
 */
router.delete(
  "/:id",
  authMiddleware,
  asyncHandler(userController.deleteUser),
);


export default router;
