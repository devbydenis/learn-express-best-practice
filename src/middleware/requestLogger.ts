import { Request, Response, NextFunction } from "express";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  console.log(`${req.method} - ${req.url}`);

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusColor = res.statusCode >= 400 ? "🔴" : "✅";

    console.log(
      `${statusColor} ${req.method} ${req.path} - ${res.statusCode} - (${duration})`,
    );
  });

  next()
};

