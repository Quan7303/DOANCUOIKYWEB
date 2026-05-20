

import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'
import { env } from '../config/environment.js'

// Cấu hình Cloudinary SDK
cloudinary.config({
  cloud_name: env.CLOUDINARY_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
})

// Cloudinary Storage: ảnh tự upload lên folder 'artfolio/portfolios'
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'artfolio/portfolios',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      {
        width: 1200,
        height: 1200,
        crop: 'limit', // Không cắt, chỉ thu nhỏ nếu vượt kích thước
        quality: 'auto:good'
      }
    ]
  }
})

// Bộ lọc file: chỉ chấp nhận ảnh
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp, gif)'), false)
  }
}

// Export middleware upload (dùng trong route)
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single('image') // Tên field trong FormData phải là 'image'

export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
}).array('images', 5) // Tối đa 5 ảnh

// Export cloudinary instance để dùng ở controller (xóa ảnh)
export { cloudinary }
