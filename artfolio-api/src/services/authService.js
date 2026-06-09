import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import User from '~/models/userModel.js'
import { env } from '~/config/environment.js'
import { ApiError } from '~/utils/ApiError.js'
import { createOTP } from './otpService.js'
import { sendOTPEmail } from './emailService.js'
import { OTP } from '~/models/otpModel.js'

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID)

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

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'user',
    active: 'verify'
  })

  const otp = await createOTP(email)
  await sendOTPEmail(email, otp, 'verify_account')

  return { message: 'Tạo tài khoản thành công! Vui lòng kiểm tra email để lấy mã xác thực OTP.' }
}

const login = async (reqBody) => {
  const { email, password } = reqBody

  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    throw new ApiError(401, 'Email hoặc mật khẩu không chính xác!')
  }

  // Tài khoản đăng ký bằng Google không có password
  if (!user.password) {
    throw new ApiError(400, 'Tài khoản này được đăng ký bằng Google. Vui lòng đăng nhập bằng Google.')
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

/**
 * Đăng nhập / đăng ký bằng Google
 * Frontend gửi lên idToken (Google credential) sau khi người dùng chọn tài khoản Google.
 * Backend verify token với Google, lấy thông tin user, rồi tìm hoặc tạo tài khoản.
 */
const loginWithGoogle = async (idToken) => {
  if (!idToken) {
    throw new ApiError(400, 'Google ID Token là bắt buộc!')
  }

  // 1. Verify token với Google
  let payload
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID
    })
    payload = ticket.getPayload()
  } catch (error) {
    throw new ApiError(401, 'Google Token không hợp lệ hoặc đã hết hạn!')
  }

  const { sub: googleId, email, name, picture } = payload

  // 2. Tìm user theo googleId hoặc email
  let user = await User.findOne({ $or: [{ googleId }, { email }] })

  if (user) {
    // Tài khoản tồn tại: kiểm tra trạng thái
    if (user.active !== 'active') {
      throw new ApiError(403, 'Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động!')
    }

    // Nếu user đăng ký bằng email trước đó nhưng chưa có googleId → liên kết lại
    if (!user.googleId) {
      user.googleId = googleId
      await user.save()
    }
  } else {
    // 3. Tạo tài khoản mới từ thông tin Google
    user = await User.create({
      googleId,
      email,
      name,
      avatar: picture || 'default-avatar.png',
      role: 'user',
      active: 'active'
      // password không có — đây là tài khoản Google thuần
    })
  }

  // 4. Tạo JWT như login thường
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

const verifySignupOTP = async (email, otp) => {
  const otpRecord = await OTP.findOne({ email, otp })

  if (!otpRecord) {
    throw new ApiError(400, 'Mã xác thực OTP không đúng!')
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new ApiError(400, 'Mã xác thực OTP đã hết hạn!')
  }

  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    throw new ApiError(404, 'Không tìm thấy tài khoản để kích hoạt!')
  }

  if (user.active === 'active') {
    throw new ApiError(400, 'Tài khoản này đã được kích hoạt từ trước!')
  }

  user.active = 'active'
  await user.save()

  await OTP.deleteMany({ email })

  const accessToken = generateAccessToken(user)
  const refreshToken = generateRefreshToken(user)

  const userResponse = user.toObject()
  delete userResponse.password

  return {
    user: userResponse,
    accessToken,
    refreshToken,
    message: 'Xác thực và kích hoạt tài khoản thành công!'
  }
}

const resendSignupOTP = async (email) => {
  if (!email) throw new ApiError(400, 'Yêu cầu phải có email!')

  const user = await User.findOne({ email })
  if (!user) {
    throw new ApiError(404, 'Email không tồn tại trong hệ thống!')
  }

  if (user.active === 'active') {
    throw new ApiError(400, 'Tài khoản này đã được kích hoạt, không cần gửi lại OTP.')
  }

  const otp = await createOTP(email)
  await sendOTPEmail(email, otp, 'verify_account')

  return { message: 'Đã gửi lại mã OTP mới vào email của bạn. Vui lòng kiểm tra hộp thư.' }
}

export const authService = {
  signup,
  login,
  loginWithGoogle,
  refreshToken,
  verifySignupOTP,
  resendSignupOTP
}