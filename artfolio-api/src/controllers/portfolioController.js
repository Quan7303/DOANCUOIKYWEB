import { portfolioService } from '~/services/portfolioService.js'
import { cloudinary } from '~/middlewares/uploadMiddleware.js'

const createPortfolio = async (req, res, next) => {
  try {
    const result = await portfolioService.createPortfolio(req.body, req.file, req.user)
    res.status(201).json({ status: 'success', data: result })
  } catch (error) {
    // 🚨 QUAN TRỌNG: Thu hồi (Xóa) ảnh đã upload lên Cloudinary nếu DB lưu thất bại!
    if (req.file && req.file.filename) {
      cloudinary.uploader.destroy(req.file.filename).catch(err => {
        console.error('Không thể xóa ảnh rác trên Cloudinary:', err)
      })
    }
    next(error)
  }
}

const getPortfolioList = async (req, res, next) => {
  try {
    const result = await portfolioService.getPortfolioList(req.query)
    res.status(200).json({ status: 'success', ...result })
  } catch (error) {
    next(error)
  }
}

const getPortfolioDetail = async (req, res, next) => {
  try {
    const result = await portfolioService.getPortfolioDetail(req.params.id)
    res.status(200).json({ status: 'success', data: result })
  } catch (error) {
    next(error)
  }
}

const updatePortfolio = async (req, res, next) => {
  try {
    const result = await portfolioService.updatePortfolio(req.params.id, req.body, req.user)
    res.status(200).json({ status: 'success', data: result })
  } catch (error) {
    next(error)
  }
}

const deletePortfolio = async (req, res, next) => {
  try {
    const result = await portfolioService.deletePortfolio(req.params.id, req.user)
    res.status(200).json({ status: 'success', ...result })
  } catch (error) {
    next(error)
  }
}

const toggleLike = async (req, res, next) => {
  try {
    const userId = req.user._id.toString()
    const { portfolio, isLiked } = await portfolioService.toggleLike(req.params.id, userId)

    // Chỉ gửi thông báo socket nếu đó là hành động THÍCH (isLiked === true) và người thích không phải chủ tác phẩm
    if (isLiked && portfolio.user._id.toString() !== userId) {
      const io = req.app.get('io')
      if (io) {
        io.to(`user_${portfolio.user._id}`).emit('send_notification', {
          type: 'like',
          senderName: req.user.name || 'Ai đó',
          portfolioTitle: portfolio.title,
          portfolioId: portfolio._id
        })
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        likesCount: portfolio.likesCount,
        isLiked
      }
    })
  } catch (error) {
    next(error)
  }
}

export const portfolioController = {
  createPortfolio,
  getPortfolioList,
  getPortfolioDetail,
  updatePortfolio,
  deletePortfolio,
  toggleLike
}
