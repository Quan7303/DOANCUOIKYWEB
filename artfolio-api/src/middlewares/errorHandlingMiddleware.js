import { env } from '~/config/environment.js'

// eslint-disable-next-line no-unused-vars
export const errorHandlingMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal Server Error'

  if (err.code === 11000) {
    statusCode = 409
    const field = Object.keys(err.keyValue)[0]
    message = field === 'email' 
      ? 'Email này đã được sử dụng! Vui lòng chọn một email khác.'
      : `Trường dữ liệu '${field}' đã tồn tại và không được phép trùng lặp.`
  }

  if (err.name === 'ValidationError') {
    statusCode = 400
    message = err.message
  }

  const responseError = {
    status: 'error',
    statusCode,
    message
  }

  if (env.NODE_ENV === 'development') {
    responseError.stack = err.stack
  }

  res.status(statusCode).json(responseError)
}
