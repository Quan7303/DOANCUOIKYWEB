import { portfolioService } from '~/services/portfolioService.js'
import { cloudinary } from '~/middlewares/uploadMiddleware.js'
import Notification from '~/models/notificationModel.js'
import { emitNotification } from '~/sockets/socketHandler.js'

const createPortfolio = async (req, res, next) => {
  try {
    const io = req.app.get('io')
    const result = await portfolioService.createPortfolio(req.body, req.files, req.user, io)
    res.status(201).json({ status: 'success', data: result })
  } catch (error) {
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        if (file.filename) {
          cloudinary.uploader.destroy(file.filename).catch(err => {
            console.error('Không thể xóa ảnh rác trên Cloudinary:', err)
          })
        }
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

    // Chỉ gửi thông báo khi THÍCH (không phải bỏ thích) và không phải chủ tác phẩm
    if (isLiked && portfolio.user._id.toString() !== userId) {
      const io = req.app.get('io')

      // Lưu Notification vào DB
      await Notification.create({
        recipient: portfolio.user._id,
        sender: req.user._id,
        type: 'like',
        portfolio: portfolio._id,
      })

      // Phát socket realtime
      if (io) {
        emitNotification(
            io,
            portfolio.user._id.toString(),
            'like',
            req.user.name || 'Ai đó',
            portfolio.title,
            portfolio._id.toString()
        )
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
