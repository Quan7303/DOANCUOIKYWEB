import User from '~/models/userModel.js'
import Portfolio from '~/models/portfolioModel.js'
import Notification from '~/models/notificationModel.js'
import { ApiError } from '~/utils/ApiError.js'
import { emitNotification } from '~/sockets/socketHandler.js'
import { cloudinary } from '~/middlewares/uploadMiddleware.js'

const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -__v')

    if (!user) {
      return next(new ApiError(404, 'Không tìm thấy người dùng.'))
    }

    const portfolios = await Portfolio.find({ user: req.params.id })
      .select('title images likesCount views colors category createdAt')
      .sort({ createdAt: -1 })

    res.status(200).json({
      status: 'success',
      data: {
        ...user.toObject(),
        followersCount: user.followers.length,
        followingCount: user.following.length,
        portfolios
      }
    })
  } catch (error) {
    console.error('getUserProfile error:', error.message)
    next(error)
  }
}

const updateUserProfile = async (req, res, next) => {
  try {
    if (req.params.id !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Bạn không có quyền chỉnh sửa hồ sơ này.'))
    }

    const allowedFields = ['name', 'avatar', 'skills', 'experience', 'socialLinks', 'portfolioTitle', 'portfolioDescription']
    const updateData = {}

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field]
      }
    })

    if (Object.keys(updateData).length === 0) {
      return next(new ApiError(400, 'Không có dữ liệu hợp lệ để cập nhật.'))
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -__v')

    if (!updatedUser) {
      return next(new ApiError(404, 'Không tìm thấy người dùng.'))
    }

    res.status(200).json({
      status: 'success',
      data: updatedUser
    })
  } catch (error) {
    console.error('updateUserProfile error:', error.message)
    next(error)
  }
}

const toggleFollow = async (req, res, next) => {
  try {
    const targetUserId = req.params.id
    const currentUserId = req.user._id.toString()

    if (targetUserId === currentUserId) {
      return next(new ApiError(400, 'Bạn không thể tự theo dõi chính mình.'))
    }

    const targetUser = await User.findById(targetUserId)
    if (!targetUser) {
      return next(new ApiError(404, 'Không tìm thấy người dùng cần theo dõi.'))
    }

    const isAlreadyFollowing = targetUser.followers.some(
      id => id.toString() === currentUserId
    )

    let isFollowing

    if (isAlreadyFollowing) {
      await User.findByIdAndUpdate(targetUserId, { $pull: { followers: req.user._id } })
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUser._id } })
      isFollowing = false
    } else {
      await User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: req.user._id } })
      await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUser._id } })
      isFollowing = true

      await Notification.create({
        recipient: targetUser._id,
        sender: req.user._id,
        type: 'follow'
      })

      const io = req.app.get('io')
      if (io) {
        emitNotification(io, targetUserId, 'follow', req.user.name || 'Ai đó')
      }
    }

    const updatedTarget = await User.findById(targetUserId).select('followers following')

    res.status(200).json({
      status: 'success',
      data: {
        isFollowing,
        followersCount: updatedTarget.followers.length,
        followingCount: updatedTarget.following.length
      }
    })
  } catch (error) {
    console.error('toggleFollow error:', error.message)
    next(error)
  }
}

const updateAvatar = async (req, res, next) => {
  try {
    // Kiểm tra quyền: chỉ chủ sở hữu hoặc admin mới được cập nhật
    if (req.params.id !== req.user._id.toString() && req.user.role !== 'admin') {
      // Nếu đã upload lên Cloudinary nhưng bị chặn quyền → xóa file vừa upload
      if (req.file?.filename) {
        await cloudinary.uploader.destroy(req.file.filename)
      }
      return next(new ApiError(403, 'Bạn không có quyền cập nhật ảnh đại diện này.'))
    }

    if (!req.file) {
      return next(new ApiError(400, 'Vui lòng chọn một file ảnh để tải lên.'))
    }

    // Lấy user hiện tại để kiểm tra avatar cũ
    const user = await User.findById(req.params.id).select('avatar')
    if (!user) {
      await cloudinary.uploader.destroy(req.file.filename)
      return next(new ApiError(404, 'Không tìm thấy người dùng.'))
    }

    // Xóa avatar cũ trên Cloudinary nếu không phải ảnh mặc định
    const oldAvatar = user.avatar
    if (oldAvatar && !oldAvatar.includes('default-avatar')) {
      // Trích public_id từ URL Cloudinary (phần sau /upload/ và trước dấu chấm cuối)
      const matches = oldAvatar.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i)
      if (matches && matches[1]) {
        try {
          await cloudinary.uploader.destroy(matches[1])
        } catch (err) {
          // Không dừng flow nếu xóa ảnh cũ thất bại
          console.warn('Không thể xóa avatar cũ:', err.message)
        }
      }
    }

    // Cập nhật avatar mới vào database
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { avatar: req.file.path } }, // req.file.path là URL Cloudinary
      { new: true, runValidators: true }
    ).select('-password -__v')

    res.status(200).json({
      status: 'success',
      message: 'Cập nhật ảnh đại diện thành công.',
      data: {
        avatar: updatedUser.avatar,
        user: updatedUser
      }
    })
  } catch (error) {
    // Dọn dẹp file đã upload nếu có lỗi xảy ra
    if (req.file?.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename)
      } catch (cleanupErr) {
        console.warn('Cleanup avatar upload thất bại:', cleanupErr.message)
      }
    }
    console.error('updateAvatar error:', error.message)
    next(error)
  }
}

export const userController = {
  getUserProfile,
  updateUserProfile,
  updateAvatar,
  toggleFollow
}