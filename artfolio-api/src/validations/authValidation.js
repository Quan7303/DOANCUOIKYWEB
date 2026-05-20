import Joi from 'joi'
import { ApiError } from '~/utils/ApiError.js'

export const signupValidation = async (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().min(2).max(60).trim().messages({
      'any.required': 'Họ tên là bắt buộc!',
      'string.empty': 'Họ tên không được phép để trống!',
      'string.min': 'Họ tên phải có ít nhất {#limit} ký tự!',
      'string.max': 'Họ tên không được vượt quá {#limit} ký tự!'
    }),
    email: Joi.string().required().email().trim().messages({
      'any.required': 'Email là bắt buộc!',
      'string.empty': 'Email không được phép để trống!',
      'string.email': 'Email không đúng định dạng hợp lệ!'
    }),
    password: Joi.string().required().min(8).pattern(/[A-Za-z]/).pattern(/[0-9]/).trim().messages({
      'any.required': 'Mật khẩu là bắt buộc!',
      'string.empty': 'Mật khẩu không được phép để trống!',
      'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự!',
      'string.pattern.base': 'Mật khẩu cần chứa ít nhất 1 chữ cái và 1 chữ số!'
    })
  })

  try {
    await schema.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = error.details.map(err => err.message).join(', ')
    next(new ApiError(422, errorMessage))
  }
}

export const loginValidation = async (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().required().email().trim().messages({
      'any.required': 'Email là bắt buộc!',
      'string.empty': 'Email không được phép để trống!',
      'string.email': 'Email không đúng định dạng hợp lệ!'
    }),
    password: Joi.string().required().min(8).trim().messages({
      'any.required': 'Mật khẩu là bắt buộc!',
      'string.empty': 'Mật khẩu không được phép để trống!',
      'string.min': 'Mật khẩu phải có ít nhất {#limit} ký tự!'
    })
  })

  try {
    await schema.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = error.details.map(err => err.message).join(', ')
    next(new ApiError(422, errorMessage))
  }
}
