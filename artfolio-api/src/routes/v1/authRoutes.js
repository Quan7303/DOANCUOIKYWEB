import express from 'express'
import rateLimit from 'express-rate-limit'
import { signupValidation, loginValidation } from '~/validations/authValidation.js'
import { authController } from '~/controllers/authController.js'

const Router = express.Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Bạn đã đăng nhập sai quá nhiều lần! Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false
})

Router.post('/signup', signupValidation, authController.signup)
Router.post('/login', loginLimiter, loginValidation, authController.login)
Router.delete('/logout', authController.logout)
Router.get('/refresh-token', authController.refreshToken)

export const authRoutes = Router
