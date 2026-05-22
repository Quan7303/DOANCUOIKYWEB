import { OTP } from '../models/otpModel.js'
import { generateOTP } from '../utils/generateOTP.js'

export const createOTP = async email => {
    const otp = generateOTP()

    await OTP.deleteMany({ email })

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await OTP.create({
        email,
        otp,
        expiresAt
    })

    return otp
}