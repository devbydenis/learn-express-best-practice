import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../utils/errors";

/**
 * Schema untuk create user
 * Zod akan validate runtime dan TypeScript types otomatis di-infer
 */
export const createUserSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),

  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be less than 50 characters")
    .trim(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character",
    ),
});

/**
 * Schema untuk update user (semua fields optional)
 */
export const updateUserSchema = z
  .object({
    email: z
      .string()
      .email("Invalid email format")
      .toLowerCase()
      .trim()
      .optional(),

    name: z
      .string()
      .min(3, "Name must be at least 3 characters")
      .max(50, "Name must be less than 50 characters")
      .trim()
      .optional(),
  })
  .strict(); // Reject extra fields

/**
 * Schema untuk login
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

/**
 * Schema untuk change password
 */
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/[0-9]/, "Must contain number")
    .regex(/[^A-Za-z0-9]/, "Must contain special char"),
});

/**
 * Infer TypeScript types from schemas
 * Types automatically sync with validation rules!
 */
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Generic validation middleware factory
 * Bisa dipakai untuk semua schemas
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Parse & validate request body
      const validated = schema.parse(req.body);

      // Replace req.body dengan validated data (cleaned & typed)
      req.body = validated;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', error.issues))
        return;
      }
      next(error);
    }
  };
};
