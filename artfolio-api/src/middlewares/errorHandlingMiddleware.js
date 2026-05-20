import { env } from '~/config/environment.js'

/**
 * Middleware xử lý lỗi tập trung cho toàn bộ ứng dụng Express.js
 */
// eslint-disable-next-line no-unused-vars
export const errorHandlingMiddleware = (err, req, res, next) => {
  // 1. Mặc định mã lỗi là 500 (Internal Server Error) nếu không được chỉ định
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal Server Error'

  // 2. Xử lý lỗi trùng khóa (Duplicate Key) của MongoDB (ví dụ: đăng ký trùng Email đã có unique index)
  if (err.code === 11000) {
    statusCode = 409 // Conflict
    const field = Object.keys(err.keyValue)[0]
    message = field === 'email' 
      ? 'Email này đã được sử dụng! Vui lòng chọn một email khác.'
      : `Trường dữ liệu '${field}' đã tồn tại và không được phép trùng lặp.`
  }

  // 3. Xử lý các lỗi Validation (nếu Mongoose Validation hoặc Joi ném lỗi thô)
  if (err.name === 'ValidationError') {
    statusCode = 400 // Bad Request
    message = err.message
  }

  // 4. Tạo đối tượng phản hồi lỗi chuẩn đồng nhất
  const responseError = {
    status: 'error',
    statusCode: statusCode,
    message: message
  }

  // 5. Chỉ trả về Stack Trace khi đang chạy ở môi trường phát triển (Development)
  if (env.NODE_ENV === 'development') {
    responseError.stack = err.stack
  }

  // 6. Gửi phản hồi lỗi về cho Client
  res.status(statusCode).json(responseError)
}
