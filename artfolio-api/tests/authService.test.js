import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from '~/services/authService.js'
import User from '~/models/userModel.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { ApiError } from '~/utils/ApiError.js'

// Giả lập các dependencies ngoài
vi.mock('~/models/userModel.js')
vi.mock('~/services/otpService.js', () => ({
  createOTP: vi.fn().mockResolvedValue('123456')
}))
vi.mock('~/services/emailService.js', () => ({
  sendOTPEmail: vi.fn().mockResolvedValue()
}))
vi.mock('bcryptjs', () => ({
  default: {
    genSalt: vi.fn().mockResolvedValue('mock-salt'),
    hash: vi.fn().mockResolvedValue('mock-hashed-password'),
    compare: vi.fn()
  }
}))
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock-token'),
    verify: vi.fn()
  }
}))

describe('Auth Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signup', () => {
    it('1. Đăng ký thành công với dữ liệu hợp lệ', async () => {
      User.findOne.mockResolvedValue(null)
      
      const mockUserDoc = {
        _id: 'user-id-123',
        name: 'Nguyen Van A',
        email: 'test@example.com',
        role: 'user',
        active: 'active',
        toObject: function () {
          return { _id: this._id, name: this.name, email: this.email, role: this.role, active: this.active }
        }
      }
      User.create.mockResolvedValue(mockUserDoc)

      const result = await authService.signup({
        name: 'Nguyen Van A',
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result).toEqual({
        message: 'Tạo tài khoản thành công! Vui lòng kiểm tra email để lấy mã xác thực OTP.'
      })
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' })
      expect(User.create).toHaveBeenCalled()
    })

    it('2. Đăng ký thất bại nếu email đã tồn tại', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing-id' })

      await expect(
        authService.signup({
          name: 'Nguyen Van A',
          email: 'test@example.com',
          password: 'password123'
        })
      ).rejects.toThrowError(new ApiError(409, 'Email này đã được sử dụng! Vui lòng chọn một email khác.'))
    })
  })

  describe('login', () => {
    it('3. Đăng nhập thành công', async () => {
      const mockUserDoc = {
        _id: 'user-id-123',
        email: 'test@example.com',
        password: 'mock-hashed-password',
        active: 'active',
        role: 'user',
        toObject: function () {
          return { _id: this._id, email: this.email, role: this.role, active: this.active }
        }
      }

      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUserDoc)
      })
      bcrypt.compare.mockResolvedValue(true)
      jwt.sign
        .mockReturnValueOnce('access-token-123')
        .mockReturnValueOnce('refresh-token-123')

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result).toEqual({
        user: { _id: 'user-id-123', email: 'test@example.com', role: 'user', active: 'active' },
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123'
      })
    })

    it('4. Đăng nhập thất bại nếu email không tồn tại', async () => {
      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      })

      await expect(
        authService.login({
          email: 'notfound@example.com',
          password: 'password123'
        })
      ).rejects.toThrowError(new ApiError(401, 'Email hoặc mật khẩu không chính xác!'))
    })

    it('5. Đăng nhập thất bại nếu sai mật khẩu', async () => {
      const mockUserDoc = {
        _id: 'user-id-123',
        email: 'test@example.com',
        password: 'mock-hashed-password',
        active: 'active'
      }

      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUserDoc)
      })
      bcrypt.compare.mockResolvedValue(false)

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong-password'
        })
      ).rejects.toThrowError(new ApiError(401, 'Email hoặc mật khẩu không chính xác!'))
    })

    it('6. Đăng nhập thất bại nếu tài khoản bị khóa', async () => {
      const mockUserDoc = {
        _id: 'user-id-123',
        email: 'test@example.com',
        password: 'mock-hashed-password',
        active: 'ban'
      }

      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUserDoc)
      })

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'password123'
        })
      ).rejects.toThrowError(new ApiError(403, 'Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động!'))
    })
  })

  describe('refreshToken', () => {
    it('7. Refresh Token thành công', async () => {
      jwt.verify.mockReturnValue({ _id: 'user-id-123' })
      User.findById.mockResolvedValue({ _id: 'user-id-123', active: 'active' })
      jwt.sign.mockReturnValue('new-access-token')

      const result = await authService.refreshToken('valid-refresh-token')

      expect(result).toEqual({ accessToken: 'new-access-token' })
    })

    it('8. Refresh Token thất bại do hết hạn', async () => {
      const expiredError = new Error('Token expired')
      expiredError.name = 'TokenExpiredError'
      jwt.verify.mockImplementation(() => {
        throw expiredError
      })

      await expect(
        authService.refreshToken('expired-refresh-token')
      ).rejects.toThrowError(new ApiError(410, 'Phiên đăng nhập đã hết hạn! Vui lòng đăng nhập lại.'))
    })
  })
})
