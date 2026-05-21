import Joi from 'joi'
import { ApiError } from '~/utils/ApiError.js'

// Hàm trợ giúp validate chuỗi tags (cho phép cả string dip phẩy và mảng)
const tagsValidation = Joi.alternatives().try(
  Joi.array().items(Joi.string().trim()),
  Joi.string().allow('')
)

export const createValidation = async (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().required().min(5).max(100).trim().messages({
      'any.required': 'Tiêu đề là bắt buộc!',
      'string.empty': 'Tiêu đề không được để trống!',
      'string.min': 'Tiêu đề phải có ít nhất {#limit} ký tự!',
      'string.max': 'Tiêu đề không được vượt quá {#limit} ký tự!'
    }),
    description: Joi.string().allow('').max(1000).trim().messages({
      'string.max': 'Mô tả không được vượt quá {#limit} ký tự!'
    }),
    category: Joi.string().required().valid('design', 'art', 'photo', '3d', 'other').messages({
      'any.required': 'Danh mục là bắt buộc!',
      'any.only': 'Danh mục không hợp lệ!'
    }),
    tags: tagsValidation
  })

  try {
    // Validate req.body (Lưu ý: Multer đã chạy trước đó, nên req.body đã có dữ liệu text)
    await schema.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    // 🚨 QUAN TRỌNG: Thu hồi (Xóa) ảnh đã upload lên Cloudinary nếu Validation thất bại!
    if (req.file && req.file.filename) {
      import('~/middlewares/uploadMiddleware.js').then(({ cloudinary }) => {
        cloudinary.uploader.destroy(req.file.filename).catch(err => {
          console.error('Không thể xóa ảnh rác trên Cloudinary:', err)
        })
      })
    }
    
    const errorMessage = error.details.map(err => err.message).join(', ')
    next(new ApiError(422, errorMessage))
  }
}

export const updateValidation = async (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().min(5).max(100).trim().messages({
      'string.empty': 'Tiêu đề không được để trống!',
      'string.min': 'Tiêu đề phải có ít nhất {#limit} ký tự!',
      'string.max': 'Tiêu đề không được vượt quá {#limit} ký tự!'
    }),
    description: Joi.string().allow('').max(1000).trim().messages({
      'string.max': 'Mô tả không được vượt quá {#limit} ký tự!'
    }),
    category: Joi.string().valid('design', 'art', 'photo', '3d', 'other').messages({
      'any.only': 'Danh mục không hợp lệ!'
    }),
    tags: tagsValidation
  })

  try {
    // allowUnknown: true để cho phép các trường ngoài schema (nhưng ta không set strict ở đây nên dùng mặc định)
    await schema.validateAsync(req.body, { abortEarly: false, allowUnknown: true })
    next()
  } catch (error) {
    const errorMessage = error.details.map(err => err.message).join(', ')
    next(new ApiError(422, errorMessage))
  }
}
