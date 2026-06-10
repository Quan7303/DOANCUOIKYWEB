import mongoose from 'mongoose'
import Portfolio from '~/models/portfolioModel.js'
import Comment from '~/models/commentModel.js'
import Notification from '~/models/notificationModel.js'
import User from '~/models/userModel.js'
import { cloudinary } from '~/middlewares/uploadMiddleware.js'
import { extractColorsFromUrl } from '~/utils/colorExtractor.js'
import { ApiError } from '~/utils/ApiError.js'

// Trích xuất publicId từ URL Cloudinary
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('/image/upload/')) return null
  const parts = url.split('/image/upload/')
  if (parts.length < 2) return null
  const pathParts = parts[1].split('/')
  if (pathParts[0].startsWith('v') && /^\d+$/.test(pathParts[0].substring(1))) {
    pathParts.shift()
  }
  const pathWithoutVersion = pathParts.join('/')
  const extensionIndex = pathWithoutVersion.lastIndexOf('.')
  if (extensionIndex !== -1) {
    return pathWithoutVersion.substring(0, extensionIndex)
  }
  return pathWithoutVersion
}

const parseTags = (tags) => {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  try {
    const parsed = JSON.parse(tags)
    if (Array.isArray(parsed)) {
      return parsed.map(t => String(t).trim()).filter(Boolean)
    }
  } catch (error) {
    // Không phải mảng JSON hợp lệ, fallback sang split phẩy
  }
  return String(tags).split(',').map((t) => t.trim()).filter(Boolean)
}

/**
 * Tạo portfolio mới.
 * io được truyền vào để phát thông báo new_post đến followers ngay sau khi lưu DB.
 */
const createPortfolio = async (reqBody, files, user, io = null) => {
  if (!files || files.length === 0) {
    throw new ApiError(400, 'Vui lòng chọn ít nhất 1 ảnh để tải lên')
  }

  const { title, description, category, tags } = reqBody

  // Trích xuất màu chủ đạo từ ảnh đầu tiên
  const colors = await extractColorsFromUrl(files[0].path)

  // Lấy mảng đường dẫn của tất cả ảnh
  const imagePaths = files.map(file => file.path)

  const portfolio = await Portfolio.create({
    title,
    description: description || '',
    category: category || 'other',
    tags: parseTags(tags),
    images: imagePaths,
    colors,
    user: user._id
  })

  await portfolio.populate('user', 'name avatar')

  // ── Gửi thông báo bài mới đến tất cả followers ──────────────────────────
  if (io) {
    try {
      const author = await User.findById(user._id).select('followers name')
      if (author && author.followers.length > 0) {
        const { emitNewPostToFollowers } = await import('~/sockets/socketHandler.js')

        // Lưu Notification cho từng follower vào DB
        const notifDocs = author.followers.map((followerId) => ({
          recipient: followerId,
          sender: user._id,
          type: 'new_post',
          portfolio: portfolio._id
        }))
        await Notification.insertMany(notifDocs)

        // Phát socket realtime
        emitNewPostToFollowers(
          io,
          author.followers.map((id) => id.toString()),
          author.name,
          portfolio._id.toString(),
          portfolio.title
        )
      }
    } catch (err) {
      // Không để lỗi thông báo làm hỏng response tạo portfolio
      console.error('Lỗi khi gửi thông báo bài mới:', err.message)
    }
  }

  return portfolio
}

const getPortfolioList = async (queryParams) => {
  const { category, colors, tags, user, search, page = 1, limit = 10 } = queryParams
  const query = {}

  if (category) query.category = category
  if (user) query.user = user

  if (colors) {
    const colorClean = colors.replace('#', '')
    query.colors = { $regex: colorClean, $options: 'i' }
  }

  if (tags) {
    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean)
    if (tagsArray.length > 0) {
      query.tags = { $in: tagsArray.map(t => new RegExp(`^${t}$`, 'i')) }
    }
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i')
    query.$or = [
      { title: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
      { tags: { $in: [searchRegex] } }
    ]
  }

  const skip = (parseInt(page) - 1) * parseInt(limit)

  const [portfolios, totalCount] = await Promise.all([
    Portfolio.find(query)
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Portfolio.countDocuments(query)
  ])

  return {
    results: portfolios.length,
    totalCount,
    totalPages: Math.ceil(totalCount / parseInt(limit)),
    currentPage: parseInt(page),
    data: portfolios
  }
}

const getPortfolioDetail = async (portfolioId) => {
  const portfolio = await Portfolio.findById(portfolioId)
    .populate('user', 'name avatar portfolioTitle')

  if (!portfolio) {
    throw new ApiError(404, 'Không tìm thấy tác phẩm')
  }

  return portfolio
}

const increasePortfolioView = async (portfolioId) => {
  const portfolio = await Portfolio.findByIdAndUpdate(
    portfolioId,
    { $inc: { views: 1 } },
    { new: true }
  ).select('views')

  if (!portfolio) {
    throw new ApiError(404, 'Không tìm thấy tác phẩm')
  }

  return {
    views: portfolio.views
  }
}

const updatePortfolio = async (portfolioId, reqBody, user) => {
  const portfolio = await Portfolio.findById(portfolioId)

  if (!portfolio) {
    throw new ApiError(404, 'Không tìm thấy tác phẩm')
  }

  if (portfolio.user.toString() !== user._id.toString() && user.role !== 'admin') {
    throw new ApiError(403, 'Bạn không có quyền chỉnh sửa tác phẩm này')
  }

  const { title, description, category, tags } = reqBody

  if (title) portfolio.title = title
  if (description !== undefined) portfolio.description = description
  if (category) portfolio.category = category
  if (tags) {
    portfolio.tags = parseTags(tags)
  }

  await portfolio.save()
  await portfolio.populate('user', 'name avatar')

  return portfolio
}

const deletePortfolio = async (portfolioId, user) => {
  const portfolio = await Portfolio.findById(portfolioId)

  if (!portfolio) {
    throw new ApiError(404, 'Không tìm thấy tác phẩm')
  }

  if (portfolio.user.toString() !== user._id.toString() && user.role !== 'admin') {
    throw new ApiError(403, 'Bạn không có quyền xóa tác phẩm này')
  }


  const session = await mongoose.startSession()

  try {
    await session.withTransaction(async () => {
      await Portfolio.deleteOne({ _id: portfolioId }, { session })
      await Comment.deleteMany({ portfolio: portfolioId }, { session })
      await Notification.deleteMany({ portfolio: portfolioId }, { session })
    })
  } catch (transactionError) {
    console.warn('⚠️ Transaction bị lỗi hoặc không được hỗ trợ. Chuyển sang xóa tuần tự (Fallback)...')
    await Portfolio.deleteOne({ _id: portfolioId })
    await Comment.deleteMany({ portfolio: portfolioId })
    await Notification.deleteMany({ portfolio: portfolioId })
  } finally {
    session.endSession()
  }

  for (const imageUrl of portfolio.images) {
    const publicId = getPublicIdFromUrl(imageUrl)
    if (publicId) {
      await cloudinary.uploader.destroy(publicId).catch((err) => {
        console.error(`Không thể xóa ảnh ${publicId} trên Cloudinary:`, err)
      })
    }
  }

  return { message: 'Đã xóa tác phẩm hoàn toàn cùng với các dữ liệu liên đới (Cascade)' }
}

const toggleLike = async (portfolioId, userId) => {
  const portfolio = await Portfolio.findById(portfolioId).populate('user', '_id')

  if (!portfolio) {
    throw new ApiError(404, 'Không tìm thấy tác phẩm')
  }

  const hasLiked = portfolio.likes.some((id) => id.toString() === userId)

  if (hasLiked) {
    portfolio.likes = portfolio.likes.filter((id) => id.toString() !== userId)
  } else {
    portfolio.likes.push(userId)
  }

  portfolio.likesCount = portfolio.likes.length
  await portfolio.save()

  return {
    portfolio,
    isLiked: !hasLiked
  }
}

export const portfolioService = {
  createPortfolio,
  getPortfolioList,
  getPortfolioDetail,
  updatePortfolio,
  deletePortfolio,
  toggleLike,
  increasePortfolioView
}
