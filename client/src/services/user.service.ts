import { api, unwrapKeys, unwrapMessage } from "./api";
import { ChangePasswordPayload, UpdateProfilePayload, User} from "../types/auth.types";


export const userService = {

  async me(): Promise<User> {
    const response = await api.get('/user/me');
    const user = unwrapKeys<User>(response, ['data', 'userData', 'user']);

    if (!user?.id) {
      throw new Error('Could not load your profile.');
    }
    return user;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const response = await api.patch('/user/me', payload);
    return unwrapKeys<User>(response, ['data', 'userData', 'user']);
  },

  async changePassword({ currentPassword, newPassword }: ChangePasswordPayload): Promise<string> {
    const response = await api.patch('/user/me/password', { currentPassword, newPassword });
    return unwrapMessage(response, 'Password updated.');
  },

  async deleteAccount(): Promise<string> {
    const response = await api.delete('/user/me/delete');
    return unwrapMessage(response, 'Your account has been deleted.');
  },

}


