import express from 'express'
import { portfolioController } from '~/controllers/portfolioController.js'
import { createValidation, updateValidation } from '~/validations/portfolioValidation.js'
import { uploadMultiple } from '~/middlewares/uploadMiddleware.js'
import { protect } from '~/middlewares/authMiddleware.js'

const Router = express.Router()

Router.get('/', portfolioController.getPortfolioList)
Router.get('/:id', portfolioController.getPortfolioDetail)

Router.post('/', protect, uploadMultiple, createValidation, portfolioController.createPortfolio)
Router.put('/:id', protect, updateValidation, portfolioController.updatePortfolio)
Router.delete('/:id', protect, portfolioController.deletePortfolio)
Router.post('/:id/like', protect, portfolioController.toggleLike)

export const portfolioRoutes = Router
