import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema(
  {
    portfolio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Portfolio',
      required: [true, 'Bình luận phải thuộc về một tác phẩm']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Bình luận phải thuộc về một người dùng']
    },
    text: {
      type: String,
      required: [true, 'Nội dung bình luận không được bỏ trống'],
      trim: true,
      maxlength: [500, 'Nội dung bình luận không được vượt quá 500 ký tự']
    }
  },
  {
    timestamps: true
  }
)

// Đánh chỉ mục để sắp xếp bình luận mới nhất lên đầu tiên nhanh chóng
commentSchema.index({ portfolio: 1, createdAt: -1 })

export default mongoose.model('Comment', commentSchema)
