import nodemailer from 'nodemailer'
import { env } from '../config/environment.js'

export const sendOTPEmail = async (to, otp) => {
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

    await transporter.sendMail({
        from: env.EMAIL_USER,

        to,

        subject: 'Mã OTP đặt lại mật khẩu',

        html: `
      <h2>Reset Password</h2>

      <p>Mã OTP của bạn là:</p>

      <h1>${otp}</h1>

      <p>OTP hết hạn sau 5 phút.</p>
    `
    })
}