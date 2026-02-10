import express, { Request, Response } from "express";
import path from "path";
import cors from "cors";
import { corsOptions } from "./config/cors";
import { config } from "./config/env";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import uploadRoutes from "./routes/upload.route";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import { apiLimiter, authLimiter } from "./middleware/rateLimitter";

const app = express();

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Serve uploaded files as static
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Apply authLimiter to auth routes ONLY
app.use("/auth", authLimiter);

// Apply general apiLimiter to everything else
app.use(apiLimiter);

// Routes
app.use("/auth", authRoutes); // Public: /auth/register, /auth/login
app.use("/users", userRoutes); // Protected & public routes
app.use("/upload", uploadRoutes);

// Global Error handler
app.use(errorHandler);

app.listen(config.port);
