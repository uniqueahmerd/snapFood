import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import passport from "passport";

//import Routes and middleware
import router from "./router";
import { logger } from "./config/logger";
import { corsOptions } from "./config/cors";
import { errorHandler } from "./shared/midddleware/errorHandler";
import { configurePassport } from "./config/passport.config";
import { env } from "./config/env";

// Create Express application
const app: Application = express();
configurePassport();

// Middleware setup
app.use(helmet());
app.use(cookieParser());
app.use(passport.initialize());
app.set("trust proxy", 1);
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

// // Logging middleware
// app.use(
//   morgan("dev", {
//     stream: { write: (message: string) => logger.http(message.trim()) },
//   }),
// );

// Logging middleware
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

/* ----------------------------- Application Routes ----------------------------- */

// API routes
app.use("/api/v1/", router);

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: "ok", 
    message: 'SnapFood API is running',  
    timestamp: new Date().toISOString() }).send();
});

// Handle undefined routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ status: "fail", message: "Route not found" });
});

//Global error handler
app.use(errorHandler);

export default app;
