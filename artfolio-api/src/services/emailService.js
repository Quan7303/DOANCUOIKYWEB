import nodemailer from 'nodemailer'
import { env } from '../config/environment.js'

export const sendOTPEmail = async (to, otp, type = 'reset_password') => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',

    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS
    },

    tls: {
      rejectUnauthorized: false
    }
  })

  let subject = 'Mã OTP đặt lại mật khẩu'
  let html = `
    <h2>Khôi phục mật khẩu</h2>
    <p>Mã OTP để khôi phục mật khẩu của bạn là:</p>
    <h1>${otp}</h1>
    <p>Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ cho bất kỳ ai.</p>
  `

  if (type === 'verify_account') {
    subject = 'Mã OTP xác thực tài khoản ArtFolio'
    html = `
      <h2>Xác thực tài khoản</h2>
      <p>Chào mừng bạn đến với ArtFolio! Để hoàn tất việc đăng ký, vui lòng nhập mã OTP sau:</p>
      <h1>${otp}</h1>
      <p>Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ cho bất kỳ ai.</p>
    `
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM || env.EMAIL_USER,
    to,
    subject,
    html
  })
}