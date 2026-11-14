import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { Role } from "../types/types";
import { USERSTATUS } from "../enums";
import { catchAsync } from "../utils/catchAsync";
import { UserRepository } from "../../modules/user/user.repo";
import { env } from "../../config/env";

export interface AuthUser {
    userId: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?:  AuthUser;
}

export const authenticate = catchAsync(async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
     return res.status(401).json({
      success: false,
      message: "Authentication required"
     })
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  let decoded: jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }

  if (typeof decoded.sub !== "string") {
    return res.status(401).json({ success: false, message: "Invalid token payload" });
  }

  const user = await UserRepository.findById(decoded.sub);
  if (!user || user.status !== USERSTATUS.ACTIVE) {
    return res.status(401).json({ success: false, message: "Your account is unavailable." });
  }

  (req as AuthRequest).user = { userId: user.id, role: user.role };
  next();
});





export const authorize = (...roles: Role[]): RequestHandler =>
  (req, res, next) => {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({success: false, message: "Unauthorized" });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({success: false, message: "Forbidden" });
    }

    next();
  };
