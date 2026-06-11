import User from '~/models/userModel.js'
import Portfolio from '~/models/portfolioModel.js'
import Comment from '~/models/commentModel.js'
import { ApiError } from '~/utils/ApiError.js'
import cloudinary from 'cloudinary'
import mongoose from 'mongoose'
import Notification from '~/models/notificationModel.js'

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

  try {
    await session.withTransaction(async () => {
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
    })

    return { message: 'Đã gỡ bỏ tác phẩm vi phạm thành công' }
  } finally {
    session.endSession()
  }
}

const deleteUserByAdmin = async (userId) => {
  const session = await mongoose.startSession()

  try {
    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session)
      if (!user) {
        throw new ApiError(404, 'Không tìm thấy người dùng')
      }

      if (user.role === 'admin') {
        throw new ApiError(403, 'Không thể xóa tài khoản Admin')
      }

      // Xóa avatar trên Cloudinary
      if (user.avatar && !user.avatar.includes('default-avatar')) {
        const matches = user.avatar.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i)
        if (matches && matches[1]) {
          try {
            await cloudinary.v2.uploader.destroy(matches[1])
          } catch (err) {
            console.error(`Lỗi xóa avatar ${matches[1]} trên Cloudinary:`, err)
          }
        }
      }

      // Tìm và xóa tất cả portfolios của user
      const userPortfolios = await Portfolio.find({ user: userId }).session(session)
      for (const portfolio of userPortfolios) {
        // Xóa ảnh portfolio trên Cloudinary
        if (portfolio.images && portfolio.images.length > 0) {
          for (const imageUrl of portfolio.images) {
            const matches = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i)
            if (matches && matches[1]) {
              try {
                await cloudinary.v2.uploader.destroy(matches[1])
              } catch (cloudErr) {
                console.error(`Lỗi xóa ảnh ${matches[1]} trên Cloudinary:`, cloudErr)
              }
            }
          }
        }
        // Xóa comment của portfolio này
        await Comment.deleteMany({ portfolio: portfolio._id }).session(session)
      }
      // Xóa tất cả portfolios của user
      await Portfolio.deleteMany({ user: userId }).session(session)

      // Xóa tất cả các reply con trỏ đến các comment do user viết
      const userComments = await Comment.find({ user: userId }).select('_id').session(session)
      if (userComments.length > 0) {
        const userCommentIds = userComments.map(c => c._id)
        await Comment.deleteMany({ parentId: { $in: userCommentIds } }).session(session)
      }

      // Xóa tất cả comments do user viết
      await Comment.deleteMany({ user: userId }).session(session)

      // Xóa tất cả notifications liên quan (gửi hoặc nhận)
      await Notification.deleteMany({
        $or: [{ recipient: userId }, { sender: userId }]
      }).session(session)

      // Gỡ user khỏi các mảng followers/following của user khác
      await User.updateMany(
        { $or: [{ followers: userId }, { following: userId }] },
        { $pull: { followers: userId, following: userId } }
      ).session(session)

      // Gỡ user khỏi danh sách likes của các portfolio
      await Portfolio.updateMany(
        { likes: userId },
        { $pull: { likes: userId }, $inc: { likesCount: -1 } }
      ).session(session)

      // Xóa user record
      await User.findByIdAndDelete(userId).session(session)
    })

    return { message: 'Đã xóa tài khoản và dọn dẹp dữ liệu thành công' }
  } finally {
    session.endSession()
  }
}

export const adminService = {
  getSystemStats,
  getAllUsers,
  changeUserStatus,
  deletePortfolioByAdmin,
  deleteUserByAdmin
}
