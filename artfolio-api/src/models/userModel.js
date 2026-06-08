import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Họ tên là bắt buộc'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      // Không required vì user đăng nhập bằng Google không có password
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
      select: false // Bảo mật: Không tự động trả về trong câu lệnh SELECT
    },
    // Google OAuth
    googleId: {
      type: String,
      default: null,
      index: true
    },
    avatar: {
      type: String,
      default: 'default-avatar.png'
    },
    portfolioTitle: {
      type: String,
      default: ''
    },
    portfolioDescription: {
      type: String,
      default: ''
    },
    skills: [{
      type: String
    }],
    experience: [{
      type: String
    }],
    socialLinks: {
      github: { type: String, default: '' },
      instagram: { type: String, default: '' },
      behance: { type: String, default: '' },
      linkedin: { type: String, default: '' }
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    active: {
      type: String,
      enum: ['active', 'verify', 'ban'],
      default: 'active' // Mặc định kích hoạt để tiện test và seed dữ liệu
    },
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  {
    timestamps: true
  }
)


export default mongoose.model('User', userSchema)