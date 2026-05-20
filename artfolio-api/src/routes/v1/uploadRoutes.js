
import express from 'express'
import { createPortfolio, deletePortfolio, toggleLike } from '../controllers/uploadController.js'
import { uploadSingle } from '../middlewares/uploadMiddleware.js'
import { protect } from '../middlewares/authMiddleware.js'

const router = express.Router()

// POST /api/portfolios - Tạo tác phẩm mới (cần đăng nhập + upload ảnh)
router.post('/', protect, uploadSingle, createPortfolio)

// DELETE /api/portfolios/:id - Xóa tác phẩm
router.delete('/:id', protect, deletePortfolio)

export default router
