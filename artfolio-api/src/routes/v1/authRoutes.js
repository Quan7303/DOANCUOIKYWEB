import express from 'express'
import rateLimit from 'express-rate-limit'

import { signupValidation, loginValidation } from '~/validations/authValidation.js'

import { authController } from '~/controllers/authController.js'

import {
  forgotPassword,
  verifyOTP,
  resetPassword
} from '../../controllers/authController.js'

const router = express.Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message: 'Bạn đã đăng nhập sai quá nhiều lần! Vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// AUTH
router.post('/signup', signupValidation, authController.signup)

router.post(
  '/login',
  loginLimiter,
  loginValidation,
  authController.login
)

// Google OAuth Login
// Body: { idToken: string }
router.post('/google-login', authController.googleLogin)

router.post('/logout', authController.logout)

router.post('/refresh-token', authController.refreshToken)

// FORGOT PASSWORD
router.post('/forgot-password', forgotPassword)

router.post('/verify-otp', verifyOTP)

router.post('/reset-password', resetPassword)

export default router