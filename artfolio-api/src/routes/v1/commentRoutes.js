import express from 'express'
import { commentController } from '../../controllers/commentController.js'
import { protect } from '../../middlewares/authMiddleware.js'

const router = express.Router()

// GET /api/comments/portfolio/:portfolioId
router.get(
    '/portfolio/:portfolioId',
    commentController.getCommentsByPortfolio
)

// POST /api/comments
router.post(
    '/',
    protect,
    commentController.createComment
)

// DELETE /api/comments/:id
router.delete(
    '/:id',
    protect,
    commentController.deleteComment
)

export default router