import Notification from '~/models/notificationModel.js'
import { ApiError } from '~/utils/ApiError.js'


const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name avatar')
      .populate('portfolio', 'title')
      .sort({ createdAt: -1 })
      .limit(50)

    const unreadCount = notifications.filter((n) => !n.isRead).length

    res.status(200).json({
      status: 'success',
      unreadCount,
      results: notifications.length,
      data: notifications,
    })
  } catch (error) {
    next(error)
  }
}


const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    )

    res.status(200).json({
      status: 'success',
      message: 'Đã đánh dấu tất cả thông báo là đã đọc.',
    })
  } catch (error) {
    next(error)
  }
}


const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    )

    if (!notification) {
      return next(new ApiError(404, 'Không tìm thấy thông báo.'))
    }

    res.status(200).json({
      status: 'success',
      data: notification,
    })
  } catch (error) {
    next(error)
  }
}


const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    })

    if (!notification) {
      return next(new ApiError(404, 'Không tìm thấy thông báo.'))
    }

    res.status(200).json({
      status: 'success',
      message: 'Đã xóa thông báo.',
    })
  } catch (error) {
    next(error)
  }
}


const deleteAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id })

    res.status(200).json({
      status: 'success',
      message: 'Đã xóa toàn bộ thông báo.',
    })
  } catch (error) {
    next(error)
  }
}

export const notificationController = {
  getMyNotifications,
  markAllAsRead,
  markAsRead,
  deleteNotification,
  deleteAllNotifications,
}
