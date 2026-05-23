import mongoose from 'mongoose'

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tác phẩm phải thuộc về một người dùng']
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề tác phẩm là bắt buộc'],
      trim: true,
      minlength: [5, 'Tiêu đề phải có ít nhất 5 ký tự']
    },
    description: {
      type: String,
      default: ''
    },
    images: [{
      type: String, // URL ảnh Cloudinary
      required: [true, 'Phải có ít nhất một hình ảnh tác phẩm']
    }],
    tags: [{
      type: String // Nhãn tìm kiếm, ví dụ: ["landingpage", "vector", "app"]
    }],
    colors: [{
      type: String // Lưu tối đa 3 màu HEX trích xuất từ hình ảnh
    }],
    category: {
      type: String,
      enum: ['design', 'art', 'photo', '3d', 'other'],
      required: [true, 'Lĩnh vực tác phẩm là bắt buộc']
    },
    views: {
      type: Number,
      default: 0
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Mảng lưu các User ID thích tác phẩm này
    }],
    likesCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

// Thiết lập các chỉ mục (Indexes) phục vụ tìm kiếm & lọc nâng cao nhanh chóng
portfolioSchema.index({ category: 1, colors: 1 })
portfolioSchema.index({ tags: 1 })
portfolioSchema.index({ user: 1 })

// Chỉ mục Text Index để thực hiện tìm kiếm toàn văn (Full-text search)
portfolioSchema.index({ title: 'text', description: 'text', tags: 'text' })

export default mongoose.model('Portfolio', portfolioSchema)
