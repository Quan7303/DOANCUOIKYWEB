import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '~/models/userModel.js'
import { env } from '~/config/environment.js'
import { ApiError } from '~/utils/ApiError.js'

const generateAccessToken = (user) => {
  return jwt.sign(
    { _id: user._id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  )
}

const generateRefreshToken = (user) => {
  return jwt.sign(
    { _id: user._id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '14d' }
  )
}

const signup = async (reqBody) => {
  const { name, email, password } = reqBody

  const existUser = await User.findOne({ email })
  if (existUser) {
    throw new ApiError(409, 'Email này đã được sử dụng! Vui lòng chọn một email khác.')
  }

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'user',
    active: 'active'
  })

  const userResponse = newUser.toObject()
  delete userResponse.password

  return userResponse
}

const login = async (reqBody) => {
  const { email, password } = reqBody

  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    throw new ApiError(401, 'Email hoặc mật khẩu không chính xác!')
  }

  if (user.active !== 'active') {
    throw new ApiError(403, 'Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động!')
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    throw new ApiError(401, 'Email hoặc mật khẩu không chính xác!')
  }

  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)

  const userResponse = user.toObject()
  delete userResponse.password

  return {
    user: userResponse,
    accessToken,
    refreshToken
  }
}

const refreshToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Yêu cầu Refresh Token!')
  }

  try {
    const decoded = jwt.verify(incomingRefreshToken, env.JWT_REFRESH_SECRET)

    const user = await User.findById(decoded._id)
    if (!user) {
      throw new ApiError(404, 'Không tìm thấy thông tin tài khoản!')
    }
    if (user.active !== 'active') {
      throw new ApiError(403, 'Tài khoản đã bị khóa!')
    }

    const newAccessToken = generateAccessToken(user)

    return { accessToken: newAccessToken }
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(410, 'Phiên đăng nhập đã hết hạn! Vui lòng đăng nhập lại.')
    }
    throw new ApiError(403, 'Refresh Token không hợp lệ! Vui lòng đăng nhập lại.')
  }
}

export const authService = {
  signup,
  login,
  refreshToken
}
