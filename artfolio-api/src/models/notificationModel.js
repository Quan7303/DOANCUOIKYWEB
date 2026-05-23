import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Thông báo phải gửi đến một người nhận cụ thể']
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Thông báo phải ghi nhận người thực hiện']
    },
    type: {
      type: String,
      enum: ['like', 'comment', 'follow'],
      required: [true, 'Loại thông báo là bắt buộc']
    },
    portfolio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio' // Có thể null đối với thông báo "follow" tài khoản
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

// Đánh chỉ mục hỗ trợ nạp danh sách thông báo chưa đọc của người dùng cực nhanh
notificationSchema.index({ recipient: 1, isRead: 1 })

export default mongoose.model('Notification', notificationSchema)
