import { Router } from "express";
import { userController } from "./user.controller";
import { UpdateProfileDto } from "./dtos/update-profile.dto";
import { ChangePasswordDto } from "./dtos/change-password.dto";
import { validateDto } from "../../shared/midddleware/validate";
import {
  authenticate,
  authorize,
} from "../../shared/midddleware/auth.middleware";
import { Role } from "../../shared/types/types";
import { AdminUserStatusDto } from "./dtos/admin-user-status.dto";

const router = Router();

// All user routes require the user to be logged in
router.get("/me", authenticate, userController.getMe);

router.patch(
  "/me",
  authenticate,
  validateDto(UpdateProfileDto),
  userController.updateProfile,
);

router.patch(
  "/me/password",
  authenticate,
  validateDto(ChangePasswordDto),
  userController.changePassword,
);

//delete account
router.delete("/me/delete", authenticate, userController.deleteAccount);

router.get(
  "/admin/users",
  authenticate,
  authorize(Role.ADMIN),
  userController.getAdminUsers,
);

router.patch(
  "/admin/users/:userId/status",
  authenticate,
  authorize(Role.ADMIN),
  validateDto(AdminUserStatusDto),
  userController.updateAdminUserStatus,
);

export const userRouter: Router = router;
