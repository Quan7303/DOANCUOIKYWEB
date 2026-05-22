import express from 'express'
import { userController } from '../../controllers/userController.js'
import { protect } from '../../middlewares/authMiddleware.js'

const router = express.Router()

// GET /api/users/:id
router.get('/:id', userController.getUserProfile)

// PUT /api/users/:id
router.put('/:id', protect, userController.updateUserProfile)

// POST /api/users/:id/follow
router.post('/:id/follow', protect, userController.toggleFollow)

export default router