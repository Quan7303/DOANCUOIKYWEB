

import { Portfolio } from '../models/portfolioModel.js'
import { cloudinary } from '../middlewares/uploadMiddleware.js'
import { extractColorsFromUrl } from '../utils/colorExtractor.js'


export const createPortfolio = async (req, res) => {
  try {
    // Multer + Cloudinary đã xử lý upload, thông tin ảnh nằm trong req.file
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng chọn ảnh để tải lên' })
    }

    const { title, description, category, tags } = req.body

    if (!title) {
      // Xóa ảnh đã upload trên Cloudinary nếu validation thất bại
      await cloudinary.uploader.destroy(req.file.filename)
      return res.status(400).json({ status: 'error', message: 'Tiêu đề không được để trống' })
    }

    // Trích xuất mảng màu HEX từ URL ảnh Cloudinary
    const colors = await extractColorsFromUrl(req.file.path)

    // Tạo Portfolio mới
    const portfolio = await Portfolio.create({
      title,
      description: description || '',
      category: category || 'other',
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      images: [
        {
          url: req.file.path, // URL Cloudinary
          publicId: req.file.filename // Public ID để xóa sau này
        }
      ],
      colors,
      user: req.user.id // Lấy từ authMiddleware
    })

    // Populate user để trả về thông tin tác giả
    await portfolio.populate('user', 'name avatar')

    return res.status(201).json({
      status: 'success',
      data: {
        _id: portfolio._id,
        title: portfolio.title,
        images: portfolio.images,
        colors: portfolio.colors,
        category: portfolio.category,
        user: portfolio.user
      }
    })
  } catch (error) {
    console.error('createPortfolio error:', error)
    return res.status(500).json({ status: 'error', message: 'Lỗi server khi tạo tác phẩm' })
  }
}


export const deletePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id)

    if (!portfolio) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy tác phẩm' })
    }

    // Chỉ chủ sở hữu hoặc admin mới được xóa
    if (portfolio.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Bạn không có quyền xóa tác phẩm này' })
    }

    // Xóa ảnh trên Cloudinary (cascade)
    for (const image of portfolio.images) {
      await cloudinary.uploader.destroy(image.publicId)
    }

    // Xóa portfolio và các comment liên quan
    await Promise.all([
      portfolio.deleteOne(),

    ])

    return res.status(200).json({ status: 'success', message: 'Đã xóa tác phẩm thành công' })
  } catch (error) {
    console.error('deletePortfolio error:', error)
    return res.status(500).json({ status: 'error', message: 'Lỗi server khi xóa tác phẩm' })
  }
}

