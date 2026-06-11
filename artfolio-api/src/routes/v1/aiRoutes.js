import express from 'express'
import { analyzePalette, analyzeImage, analyzeMultipleImages } from '../../controllers/aiController.js'
import { protect } from '../../middlewares/authMiddleware.js'

const router = express.Router()

router.post('/analyze-palette', protect, analyzePalette)
router.post('/analyze-image', protect, analyzeImage)
router.post('/analyze-images', protect, analyzeMultipleImages)

export default router