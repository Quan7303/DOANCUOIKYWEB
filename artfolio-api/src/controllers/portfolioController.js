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

export const portfolioController = {
  createPortfolio,
  getPortfolioList,
  getPortfolioDetail,
  updatePortfolio,
  deletePortfolio
}
