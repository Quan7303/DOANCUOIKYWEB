
import express from 'express'
import { analyzePalette } from '../../controllers/aiController.js'
import { protect } from '../../middlewares/authMiddleware.js'

const router = express.Router()

// POST /api/ai/analyze-palette - Phân tích bảng màu (cần đăng nhập)
router.post('/analyze-palette', protect, analyzePalette)

export default router
