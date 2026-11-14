import { Response } from "express";
import { UserService } from "./user.service";
import { catchAsync } from "../../shared/utils/catchAsync";
import { AppError } from "../../shared/utils/AppError";
import type { AuthRequest } from "../../shared/midddleware/auth.middleware";
import { AdminUserStatusDto } from "./dtos/admin-user-status.dto";
import { recordAdminAction } from "../system/system.repo";

const userService = new UserService();
export const userController: Record<string, any> = {
  getMe: catchAsync(async (req, res: Response) => {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) throw new AppError("Authentication required", 401);
    const user = await userService.getMe(userId);
    res.status(200).json({
      success: true,
      data: user,
    });
  }),

  // PATCH /users/me
  updateProfile: catchAsync(async (req, res: Response) => {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) throw new AppError("Authentication required", 401);
    const user = await userService.updateProfile(userId, req.body);
    res.status(200).json({
      success: true,
      message: "Profile updated",
      data: user,
    });
  }),

  // PATCH /users/me/password
  changePassword: catchAsync(async (req, res: Response) => {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) throw new AppError("Authentication required", 401);
    await userService.changePassword(userId, req.body);
    res.status(200).json({
      success: true,
      message: "Password successfully updated",
    });
  }),

  //DELETE /users/me
  deleteAccount: catchAsync(async (req, res: Response) => {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) throw new AppError("Authentication required", 401);
    await userService.deleteAccount(userId);
    res.status(200).json({
      success: true,
      message: "Account deleted successful",
    });
  }),

  getAdminUsers: catchAsync(async (req, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.limit ?? req.query.pageSize ?? 20);
    const search = String(req.query.search ?? "").trim();
    const result = await userService.getAdminUsers(page, pageSize, search);
    res.status(200).json({ success: true, data: result });
  }),

  updateAdminUserStatus: catchAsync(async (req, res: Response) => {
    const userId = String(req.params.userId);
    const dto = req.body as AdminUserStatusDto;
    const actorId = (req as AuthRequest).user?.userId;
    let result;
    try {
      result = await userService.updateAdminUserStatus(userId, dto.status);
    } catch (error) {
      if (actorId) {
        await recordAdminAction({
          actorId,
          action: `user.${dto.status}`,
          target: userId,
          outcome: "failure",
        }).catch(() => undefined);
      }
      throw error;
    }
    if (actorId) {
      await recordAdminAction({
        actorId,
        action: `user.${dto.status}`,
        target: userId,
        outcome: "success",
      }).catch(() => undefined);
    }
    res.status(200).json({ success: true, data: result });
  }),
};
