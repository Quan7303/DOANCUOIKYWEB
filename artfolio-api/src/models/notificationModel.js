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
            enum: ['like', 'comment', 'follow', 'new_post'],
            required: [true, 'Loại thông báo là bắt buộc']
        },
        portfolio: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Portfolio' // null đối với follow; dùng cho like / comment / new_post
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

// Index hỗ trợ nạp danh sách thông báo chưa đọc cực nhanh
notificationSchema.index({ recipient: 1, isRead: 1 })
notificationSchema.index({ recipient: 1, createdAt: -1 })

export default mongoose.model('Notification', notificationSchema)
