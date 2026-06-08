import User from '~/models/userModel.js'
import Portfolio from '~/models/portfolioModel.js'
import Comment from '~/models/commentModel.js'
import { ApiError } from '~/utils/ApiError.js'
import cloudinary from 'cloudinary'
import mongoose from 'mongoose'

const getSystemStats = async () => {
  const totalUsers = await User.countDocuments()
  const totalPortfolios = await Portfolio.countDocuments()
  
  // Aggregate to get total views and likes
  const stats = await Portfolio.aggregate([
    {
      $group: {
        _id: null,
        totalViews: { $sum: '$views' },
        totalLikes: { $sum: '$likesCount' }
      }
    }
  ])

  return {
    totalUsers,
    totalPortfolios,
    totalViews: stats[0]?.totalViews || 0,
    totalLikes: stats[0]?.totalLikes || 0
  }
}

const getAllUsers = async (page = 1, limit = 10, search = '') => {
  const skip = (page - 1) * limit
  const query = {}

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  const totalResults = await User.countDocuments(query)

  return {
    results: totalResults,
    totalPages: Math.ceil(totalResults / limit),
    data: users
  }
}

const changeUserStatus = async (userId, activeStatus) => {
  if (!['active', 'verify', 'ban'].includes(activeStatus)) {
    throw new ApiError(400, 'Trạng thái không hợp lệ. Chỉ chấp nhận active, verify, ban')
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { active: activeStatus },
    { new: true, runValidators: true }
  ).select('-password')

  if (!user) {
    throw new ApiError(404, 'Không tìm thấy người dùng')
  }

  return user
}

const deletePortfolioByAdmin = async (portfolioId) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const portfolio = await Portfolio.findById(portfolioId).session(session)
    if (!portfolio) {
      throw new ApiError(404, 'Không tìm thấy tác phẩm')
    }

    // Xóa ảnh trên Cloudinary
    if (portfolio.images && portfolio.images.length > 0) {
      for (const imageUrl of portfolio.images) {
        // Lấy public_id từ URL Cloudinary
        const urlParts = imageUrl.split('/')
        const filename = urlParts[urlParts.length - 1]
        const publicId = `artfolio/portfolios/${filename.split('.')[0]}`
        
        try {
          await cloudinary.v2.uploader.destroy(publicId)
        } catch (cloudErr) {
          console.error(`Lỗi xóa ảnh ${publicId} trên Cloudinary:`, cloudErr)
        }
      }
    }

    // Xóa tất cả comment của tác phẩm này
    await Comment.deleteMany({ portfolio: portfolioId }).session(session)

    // Cuối cùng xóa tác phẩm
    await Portfolio.findByIdAndDelete(portfolioId).session(session)

    await session.commitTransaction()
    session.endSession()

    return { message: 'Đã gỡ bỏ tác phẩm vi phạm thành công' }
  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    throw error
  }
}

export const adminService = {
  getSystemStats,
  getAllUsers,
  changeUserStatus,
  deletePortfolioByAdmin
}
