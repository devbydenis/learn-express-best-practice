# Express.js Best Practices Guide

A practical guide documenting best practices for building production-ready Express.js APIs, based on real implementation experience.

## Table of Contents

- [Project Overview](#project-overview)
- [Rate Limiting Best Practices](#rate-limiting-best-practices)
- [Environment Configuration](#environment-configuration)
- [Middleware Architecture](#middleware-architecture)
- [Error Handling Patterns](#error-handling-patterns)
- [Layered Architecture](#layered-architecture)
- [Security Considerations](#security-considerations)

---

## Project Overview

This project demonstrates a production-ready Express.js API with:

- **Runtime**: Node.js with Express.js 5.x
- **Language**: TypeScript with strict configuration
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth
- **Validation**: Zod schema validation
- **Architecture**: Layered (Controller → Service → Repository)

---

## Rate Limiting Best Practices

### 1. Multiple Rate Limiters for Different Routes

Don't use a single rate limit for everything. Apply different strategies:

```typescript
// General API - permissive
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
});

// Auth routes - strict
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts only
  skipSuccessfulRequests: true, // Don't count successful logins
});
```

**Why?** Auth endpoints are attack vectors (brute-force). They need stricter limits than general API usage.

### 2. Smart Key Generation

Use IP + User ID for authenticated users to prevent:
- **Issue**: Multiple users behind same IP (offices, shared wifi) share rate limit
- **Solution**: Differentiate by user when authenticated

```typescript
const getKey = (req: AuthenticatedRequest): string => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const userId = req.user?.userId;
  
  // IP alone for guests, IP:UserID for authenticated
  return userId ? `${ip}:${userId}` : ip;
};
```

### 3. Skip Non-Essential Endpoints

Health checks and monitoring endpoints should bypass rate limiting:

```typescript
export const apiLimiter = rateLimit({
  // ...
  skip: (req) => req.path === "/health",
});
```

**Why?** Load balancers and monitoring tools poll health checks frequently. Rate limiting them causes false "down" alerts.

### 4. Consistent Error Responses

Match rate limit errors to your app's error format:

```typescript
const rateLimitHandler = (_req: any, res: any) => {
  res.status(429).json({
    success: false,
    error: "Too many requests, please try again later",
    retryAfter: res.getHeader("Retry-After"),
  });
};
```

### 5. Middleware Order Matters

Apply rate limiters in the correct order:

```typescript
// ✅ CORRECT ORDER:
app.get("/health", healthHandler);        // 1. Health check (no limit)
app.use("/auth", authLimiter);            // 2. Auth-specific limiter
app.use(apiLimiter);                      // 3. General limiter
app.use("/auth", authRoutes);             // 4. Routes

// ❌ WRONG: Applying general limiter before auth limiter
app.use(apiLimiter);                      // This blocks everything first!
app.use("/auth", authLimiter);            // Never reached for limiting
```

### 6. Environment-Based Configuration

Make rate limits configurable per environment:

```typescript
// .env
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX=100               # 100 requests
AUTH_RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
AUTH_RATE_LIMIT_MAX=5            # 5 attempts
```

Benefits:
- Increase limits in development for testing
- Decrease limits in production under attack
- No code changes needed

---

## Environment Configuration

### Use Zod for Runtime Validation

Validate environment variables at startup. Fail fast if invalid.

```typescript
const envSchema = z.object({
  PORT: z.string().transform(Number).pipe(z.number().positive()),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  // ... more validations
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    console.error(error);
    process.exit(1);  // Fail fast!
  }
};
```

### Centralized Config Object

Export a type-safe config object instead of accessing `process.env` everywhere:

```typescript
export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  database: { url: env.DATABASE_URL },
  jwt: { 
    secret: env.JWT_SECRET, 
    expiresIn: env.JWT_EXPIRES_IN 
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    authMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
    authMax: env.AUTH_RATE_LIMIT_MAX,
  },
  // Helper flags
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
} as const;
```

**Benefits:**
- Single source of truth
- Type safety and autocomplete
- Easy to mock in tests
- Transformations in one place

---

## Middleware Architecture

### The Order Principle

Express middleware executes in the order they're defined. Get it wrong = security issues.

#### ✅ Correct Order:

```typescript
// 1. Security & parsing
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Logging (before routes to log all requests)
app.use(requestLogger);

// 3. Special handlers (health check - no rate limit)
app.get("/health", healthHandler);

// 4. Rate limiting (before routes)
app.use("/auth", authLimiter);
app.use(apiLimiter);

// 5. Static files (if needed before routes)
app.use("/uploads", express.static("uploads"));

// 6. Application routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// 7. Error handling (MUST be last)
app.use(errorHandler);
```

#### ❌ Common Mistakes:

| Mistake | Problem |
|---------|---------|
| `errorHandler` before routes | Never catches route errors |
| `apiLimiter` before `authLimiter` | Auth limiter never reached |
| Body parsing after routes | `req.body` is undefined in controllers |
| Auth middleware after routes | Can't protect routes |

### Async Route Handler Wrapper

Always wrap async routes to catch errors properly:

```typescript
// utils/asyncHandler.ts
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Usage in routes
router.get('/users', asyncHandler(controller.getUsers));
```

**Without this:** Unhandled promise rejections crash the server or hang requests.

---

## Error Handling Patterns

### Custom Error Classes

Create specific error types for different HTTP status codes:

```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
  }
}
```

### Centralized Error Handler

One middleware to handle all errors:

```typescript
// middleware/errorHandler.ts
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Log the error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Operational errors (expected)
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Programming or unknown errors
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
};
```

### Operational vs Programming Errors

| Type | Examples | Handling |
|------|----------|----------|
| **Operational** | Invalid input, not found, unauthorized | Send to client with details |
| **Programming** | Null reference, type error, DB connection lost | Log, return generic 500, alert devs |

---

## Layered Architecture

### The Flow

```
Request → Route → Middleware → Controller → Service → Repository → Database
                                              ↓
                                         Response
```

### Each Layer's Responsibility

| Layer | Responsibility | Example |
|-------|---------------|---------|
| **Route** | Define endpoints, apply middleware | `router.get('/users', auth, handler)` |
| **Middleware** | Cross-cutting concerns (auth, logging, rate limit) | `authMiddleware`, `apiLimiter` |
| **Controller** | Handle HTTP, extract params, send response | Parse `req.body`, call service, `res.json()` |
| **Service** | Business logic, orchestration | Validate business rules, call repos |
| **Repository** | Database access | Prisma queries, data mapping |

### Why This Matters

**Without layers:**
```typescript
// ❌ Everything in one place - hard to test, maintain
app.post('/users', async (req, res) => {
  const hashed = await bcrypt.hash(req.body.password, 10);
  const user = await prisma.user.create({ data: { ...req.body, password: hashed } });
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  res.json({ user, token });
});
```

**With layers:**
```typescript
// ✅ Clean separation
// Controller: HTTP handling
async create(req, res) {
  const user = await userService.create(req.body);
  res.status(201).json({ success: true, data: user });
}

// Service: Business logic
async create(data) {
  const hashed = await bcrypt.hash(data.password, config.bcrypt.rounds);
  return this.userRepo.create({ ...data, password: hashed });
}

// Repository: Database
async create(data) {
  return prisma.user.create({ data, omit: { password: true } });
}
```

### Dependency Injection

Inject dependencies for testability:

```typescript
// service/user.service.ts
export class UserService {
  constructor(private userRepo: UserRepository) {}
  
  async getById(id: number) {
    return this.userRepo.findById(id);
  }
}

// Composition root
const userRepo = new UserRepository();
const userService = new UserService(userRepo);
const userController = new UserController(userService);
```

**Benefits:**
- Easy to mock in tests
- Clear dependencies
- Swappable implementations

---

## Security Considerations

### Authentication Checklist

- [ ] Passwords hashed with bcrypt (min 10 rounds)
- [ ] JWT secret min 32 characters, stored in env
- [ ] JWT expiration set (don't use never-expiring tokens)
- [ ] Auth middleware on protected routes
- [ ] Password requirements enforced (length, complexity)

### Rate Limiting Checklist

- [ ] Auth routes have stricter limits
- [ ] Successful logins don't count against limit
- [ ] Health checks bypass rate limiting
- [ ] IP + UserID key for authenticated users
- [ ] Environment-configurable limits

### Input Validation

Use Zod for all inputs:

```typescript
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Need uppercase')
    .regex(/[a-z]/, 'Need lowercase')
    .regex(/[0-9]/, 'Need number')
    .regex(/[^A-Za-z0-9]/, 'Need special char'),
  name: z.string().min(2).max(100),
});
```

### CORS Configuration

Don't allow all origins in production:

```typescript
const corsOptions = {
  origin: config.isDevelopment 
    ? true  // Allow all in dev
    : config.cors.allowedOrigins,  // Specific origins in prod
  credentials: true,
};
```

---

## Testing Strategy

### Unit Tests

Test each layer in isolation:

```typescript
// Test service without hitting database
describe('UserService', () => {
  it('should create user with hashed password', async () => {
    const mockRepo = { create: jest.fn() };
    const service = new UserService(mockRepo as any);
    
    await service.create({ email: 'test@test.com', password: 'password123' });
    
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        password: expect.not.stringMatching('password123'), // Should be hashed
      })
    );
  });
});
```

### Integration Tests

Test full request flow:

```typescript
describe('POST /auth/register', () => {
  it('should rate limit after 5 attempts', async () => {
    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      await request(app).post('/auth/register').send(validData);
    }
    
    // 6th should be rate limited
    const res = await request(app).post('/auth/register').send(validData);
    expect(res.status).toBe(429);
  });
});
```

---

## Development Workflow

### Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate"
  }
}
```

### Environment Files

| File | Purpose |
|------|---------|
| `.env` | Local development (gitignored) |
| `.env.example` | Template showing all required variables |
| `.env.test` | Test environment overrides |

---

## Key Takeaways

1. **Rate Limiting**: Multiple limiters, smart keys, skip health checks, consistent errors
2. **Config**: Zod validation, centralized config object, environment-based
3. **Middleware Order**: Security → Parsing → Logging → Special → Rate Limit → Routes → Error Handler
4. **Architecture**: Layered with clear responsibilities, dependency injection
5. **Errors**: Custom classes, centralized handler, operational vs programming distinction
6. **Security**: Never trust input, hash passwords, JWT best practices, strict CORS

---

## Resources

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [express-rate-limit documentation](https://express-rate-limit.mintlify.app/)
- [Zod documentation](https://zod.dev/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
