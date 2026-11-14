import bcrypt from "bcryptjs";

import { UserRepository } from "./user.repo";
import { AppError } from "../../shared/utils/AppError";
import { UpdateProfileDto } from "./dtos/update-profile.dto";
import { ChangePasswordDto } from "./dtos/change-password.dto";
import { USERSTATUS } from "../../shared/enums";

export class UserService {
  //getting the current logged-in user with an id
  async getMe(userId: string) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    return user;
  }

  //update user profile function
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    return UserRepository.save({ ...user, ...dto });
  }

  //change password function
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    // Re-fetch with passwordHash — findById does not return it
    const userWithPassword = await UserRepository.findByEmail(user.email);
    if (!userWithPassword) throw new AppError("User not found", 404);

    // Compare entered password against stored hash
    const isMatch = await bcrypt.compare(
      dto.currentPassword,
      userWithPassword.password,
    );
    if (!isMatch) throw new AppError("Current password is incorrect", 400);

    // Hash the new password and save
    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await UserRepository.save({ id: userId, password: newHash });
  }

  //delete account
  async deleteAccount(userId: string) {
    await UserRepository.softDelete(userId);
  }

  async getAdminUsers(page = 1, pageSize = 20, search = "") {
    const normalizedPage = Math.max(1, page);
    const normalizedPageSize = Math.min(100, Math.max(1, pageSize));
    const normalizedSearch = search.toLowerCase().trim();

    const [items, total] = await UserRepository.listForAdmin(
      normalizedSearch,
      normalizedPageSize,
      (normalizedPage - 1) * normalizedPageSize,
    );

    return {
      items,
      page: normalizedPage,
      pages: Math.max(1, Math.ceil(total / normalizedPageSize)),
      total,
    };
  }

  async updateAdminUserStatus(userId: string, status: USERSTATUS) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    if (user.role === "admin") {
      throw new AppError("Administrator accounts cannot be suspended", 400);
    }

    await UserRepository.save({ id: userId, status });
    return { id: userId, status };
  }
}
