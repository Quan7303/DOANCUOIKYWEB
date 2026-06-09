import { authService } from '~/services/authService.js'
import bcrypt from 'bcryptjs'

import User from '../models/userModel.js'
import { OTP } from '../models/otpModel.js'

import { createOTP } from '../services/otpService.js'
import { sendOTPEmail } from '../services/emailService.js'

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        message: 'Email không tồn tại'
      })
    }

    const otp = await createOTP(email)

    await sendOTPEmail(email, otp, 'reset_password')

    return res.status(200).json({
      message: 'Đã gửi OTP về email'
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      message: error.message
    })
  }

}

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body

    const otpRecord = await OTP.findOne({
      email,
      otp
    })

    if (!otpRecord) {
      return res.status(400).json({
        message: 'OTP không đúng'
      })
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({
        message: 'OTP đã hết hạn'
      })
    }

    return res.status(200).json({
      message: 'OTP hợp lệ'
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      message: error.message
    })
  }}

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body

    const otpRecord = await OTP.findOne({ email, otp })

    if (!otpRecord) {
      return res.status(400).json({
        message: 'OTP không hợp lệ'
      })
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword }
    )

    await OTP.deleteMany({ email })

    return res.status(200).json({
      message: 'Đổi mật khẩu thành công'
    })

  } catch (error) {
    return res.status(500).json({
      message: 'Reset password thất bại'
    })
  }
}


const signup = async (req, res, next) => {
  try {
    const result = await authService.signup(req.body)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body)

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 14 * 24 * 60 * 60 * 1000
    })

    res.status(200).json({
      user: result.user,
      accessToken: result.accessToken
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/v1/auth/google-login
 * Body: { idToken: string }  — Google credential từ frontend (Google Identity Services)
 */
const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body
    const result = await authService.loginWithGoogle(idToken)

    // Đặt refreshToken vào cookie httpOnly giống login thường
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 14 * 24 * 60 * 60 * 1000
    })

    res.status(200).json({
      user: result.user,
      accessToken: result.accessToken
    })
  } catch (error) {
    next(error)
  }
}

const logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    })
    res.status(200).json({ message: 'Đăng xuất thành công!' })
  } catch (error) {
    next(error)
  }
}

const refreshToken = async (req, res, next) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken
    const result = await authService.refreshToken(incomingRefreshToken)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

const verifySignupOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body
    const result = await authService.verifySignupOTP(email, otp)

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 14 * 24 * 60 * 60 * 1000
    })

    res.status(200).json({
      message: result.message,
      user: result.user,
      accessToken: result.accessToken
    })
  } catch (error) {
    next(error)
  }
}

const resendSignupOTP = async (req, res, next) => {
  try {
    const { email } = req.body
    const result = await authService.resendSignupOTP(email)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export const authController = {
  signup,
  login,
  googleLogin,
  logout,
  refreshToken,
  forgotPassword,
  verifyOTP,
  resetPassword,
  verifySignupOTP,
  resendSignupOTP
}