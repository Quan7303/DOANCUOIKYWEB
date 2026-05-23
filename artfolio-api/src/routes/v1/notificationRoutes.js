import express from 'express'
import { notificationController } from '~/controllers/notificationController.js'
import { protect } from '~/middlewares/authMiddleware.js'

const router = express.Router()

// Tất cả route thông báo đều yêu cầu đăng nhập
router.use(protect)

// GET    /api/notifications          — lấy danh sách thông báo của mình
router.get('/', notificationController.getMyNotifications)

// PATCH  /api/notifications/read-all — đánh dấu tất cả đã đọc
router.patch('/read-all', notificationController.markAllAsRead)

// PATCH  /api/notifications/:id/read — đánh dấu 1 thông báo đã đọc
router.patch('/:id/read', notificationController.markAsRead)

// DELETE /api/notifications          — xóa toàn bộ thông báo
router.delete('/', notificationController.deleteAllNotifications)

// DELETE /api/notifications/:id      — xóa 1 thông báo
router.delete('/:id', notificationController.deleteNotification)

export default router
