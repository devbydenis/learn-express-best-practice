import express from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  validate,
  createUserSchema,
  loginSchema,
  changePasswordSchema,
} from "../validators/user.validator";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = express.Router();
const authController = new AuthController();

/**
 * POST /auth/register - Register new user
 */
router.post(
  "/register",
  validate(createUserSchema),
  asyncHandler(authController.register),
);

/**
 * POST /auth/login - Login user
 */
router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(authController.login),
);

/**
 * POST /auth/change-password - Change password
 */
router.post(
  "/change-password",
  authMiddleware,   // --> auth-first reject to saves validation overhead on junk request
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword),
);

export default router;
