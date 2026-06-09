import { justForYouService } from '~/services/justForYouService.js'

/**
 * GET /api/v1/portfolios/just-for-you
 * Trả về feed cá nhân hoá cho user đang đăng nhập.
 * Yêu cầu xác thực (middleware protect).
 */
const getJustForYouFeed = async (req, res, next) => {
  try {
    const userId = req.user._id.toString()
    const result = await justForYouService.getJustForYouFeed(userId, req.query)

    res.status(200).json({
      status: 'success',
      ...result
    })
  } catch (error) {
    next(error)
  }
}

export const justForYouController = {
  getJustForYouFeed
}