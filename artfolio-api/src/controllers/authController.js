import { authService } from '~/services/authService.js'

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

export const authController = {
  signup,
  login,
  logout,
  refreshToken
}
