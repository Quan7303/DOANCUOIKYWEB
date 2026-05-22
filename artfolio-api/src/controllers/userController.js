import User from '~/models/userModel.js'
import Portfolio from '~/models/portfolioModel.js'
import Notification from '~/models/notificationModel.js'
import { ApiError } from '~/utils/ApiError.js'
import { emitNotification } from '~/sockets/socketHandler.js'

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

export const userController = {
  getUserProfile,
  updateUserProfile,
  toggleFollow
}