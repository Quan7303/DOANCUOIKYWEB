import express from 'express'
import { userController } from '../../controllers/userController.js'
import { protect } from '../../middlewares/authMiddleware.js'
import { uploadAvatar } from '../../middlewares/uploadMiddleware.js'

const router = express.Router()

// GET /api/users/:id
router.get('/:id', userController.getUserProfile)

// PUT /api/users/:id
router.put('/:id', protect, userController.updateUserProfile)

// PATCH /api/users/:id/avatar  — cập nhật ảnh đại diện
router.patch('/:id/avatar', protect, uploadAvatar, userController.updateAvatar)

// POST /api/users/:id/follow
router.post('/:id/follow', protect, userController.toggleFollow)

export default router