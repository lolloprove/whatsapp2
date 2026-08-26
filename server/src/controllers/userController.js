import { storageService } from '../services/storageService.js';

export const userController = {
  async searchUsers(req, res, next) {
    try {
      const { q } = req.query;
      const currentUserId = req.user?.id;
      const rawUsers = await storageService.searchUsers(q || '', currentUserId);

      const formatted = rawUsers.map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
        isOnline: storageService.isUserOnline(u.id) || (u.isOnline ?? false),
        lastSeen: u.lastSeen
      }));

      return res.status(200).json({
        success: true,
        data: formatted
      });
    } catch (err) {
      next(err);
    }
  }
};
