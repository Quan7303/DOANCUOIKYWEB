import Comment from '~/models/commentModel.js'
import Portfolio from '~/models/portfolioModel.js'
import Notification from '~/models/notificationModel.js'
import { ApiError } from '~/utils/ApiError.js'
import { emitNotification, emitNewComment } from '~/sockets/socketHandler.js'

const getCommentsByPortfolio = async (req, res, next) => {
  try {
    const { portfolioId } = req.params

    const portfolio = await Portfolio.findById(portfolioId)
    if (!portfolio) {
      return next(new ApiError(404, 'Không tìm thấy tác phẩm.'))
    }

    const comments = await Comment.find({ portfolio: portfolioId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })

    res.status(200).json({
      status: 'success',
      results: comments.length,
      data: comments
    })
  } catch (error) {
    console.error('getCommentsByPortfolio error:', error.message)
    next(error)
  }
}

const createComment = async (req, res, next) => {
  try {
    const { portfolioId, text } = req.body
    const senderId = req.user._id

    if (!portfolioId) {
      return next(new ApiError(400, 'portfolioId là bắt buộc.'))
    }
    if (!text || !text.trim()) {
      return next(new ApiError(400, 'Nội dung bình luận không được bỏ trống.'))
    }

    const portfolio = await Portfolio.findById(portfolioId).populate('user', '_id name')
    if (!portfolio) {
      return next(new ApiError(404, 'Không tìm thấy tác phẩm.'))
    }

    const newComment = await Comment.create({
      portfolio: portfolioId,
      user: senderId,
      text: text.trim()
    })

    const populatedComment = await newComment.populate('user', 'name avatar')

    const io = req.app.get('io')
    const ownerId = portfolio.user._id.toString()
    const senderIdStr = senderId.toString()

    if (io) {
      emitNewComment(io, portfolioId, populatedComment)
    }

    if (ownerId !== senderIdStr) {
      await Notification.create({
        recipient: portfolio.user._id,
        sender: senderId,
        type: 'comment',
        portfolio: portfolioId
      })

      if (io) {
        const sender = {
          _id: req.user._id,
          name: req.user.name || 'Ai đó',
          avatar: req.user.avatar
        }
        emitNotification(io, ownerId, 'comment', sender, portfolio.title, portfolioId)
      }
    }

    res.status(201).json({
      status: 'success',
      data: populatedComment
    })
  } catch (error) {
    console.error('createComment error:', error.message)
    next(error)
  }
}

const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id)

    if (!comment) {
      return next(new ApiError(404, 'Không tìm thấy bình luận.'))
    }

    const isOwner = comment.user.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return next(new ApiError(403, 'Bạn không có quyền xóa bình luận này.'))
    }

    await Comment.findByIdAndDelete(req.params.id)

    res.status(200).json({
      status: 'success',
      message: 'Đã xóa bình luận thành công.'
    })
  } catch (error) {
    console.error('deleteComment error:', error.message)
    next(error)
  }
}

export const commentController = {
  getCommentsByPortfolio,
  createComment,
  deleteComment
}