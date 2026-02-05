import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import { asyncHandler } from "../utils/asyncHandler";
import {
  validate,
  createUserSchema,
  loginSchema,
} from "../validators/user.validator";
import { generateToken } from "../utils/jwt";
import { config } from "../config/env";
import prisma from "../config/database";

const router = express.Router();

/**
 * POST /auth/register - Register new user
 */
router.post(
  "/register",
  validate(createUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name, password } = req.body;

    // Hash password dengan bcrypt
    const hashedPassword = await bcrypt.hash(password, config.bcrypt.rounds);

    // Create user di database
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword, // Store hashed password
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
        token,
      },
    });
  }),
);

/**
 * POST /auth/login - Login user
 */
router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // User not found
    if (!user) {
      res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
      return;
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
      return;
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      },
    });
  }),
);

export default router;
