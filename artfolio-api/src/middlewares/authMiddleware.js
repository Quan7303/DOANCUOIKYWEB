import jwt from 'jsonwebtoken'
import { env } from '~/config/environment.js'
import User from '~/models/userModel.js'
import { ApiError } from '~/utils/ApiError.js'

export const protect = async (req, res, next) => {
  let token

  // 1. Lấy token từ header Authorization (Bearer <token>)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return next(new ApiError(401, 'Bạn chưa đăng nhập! Vui lòng đăng nhập để thực hiện hành động này.'))
  }

  try {
    // 2. Giải mã token bằng Secret Key
    const decoded = jwt.verify(token, env.JWT_SECRET)

    // 3. Kiểm tra xem user có còn tồn tại trong DB không (nhỡ bị xóa rồi)
    const currentUser = await User.findById(decoded._id)
    if (!currentUser) {
      return next(new ApiError(401, 'Người dùng thuộc về token này không còn tồn tại.'))
    }

    // 4. Kiểm tra xem tài khoản có bị khóa không
    if (currentUser.active !== 'active') {
      return next(new ApiError(403, 'Tài khoản của bạn đã bị khóa!'))
    }

    // 5. Gắn user vào req để các controller/service phía sau sử dụng
    req.user = currentUser
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(410, 'Phiên đăng nhập đã hết hạn! Vui lòng làm mới token (Refresh Token).'))
    }
    return next(new ApiError(401, 'Token không hợp lệ! Vui lòng đăng nhập lại.'))
  }
}
