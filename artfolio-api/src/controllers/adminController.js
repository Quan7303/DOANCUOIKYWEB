import { adminService } from '~/services/adminService.js'

const getSystemStats = async (req, res, next) => {
  try {
    const stats = await adminService.getSystemStats()
    res.status(200).json({
      status: 'success',
      data: stats
    })
  } catch (error) {
    next(error)
  }
}

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 10
    const search = req.query.search || ''

    const result = await adminService.getAllUsers(page, limit, search)

    res.status(200).json({
      status: 'success',
      results: result.results,
      totalPages: result.totalPages,
      data: result.data
    })
  } catch (error) {
    next(error)
  }
}

const changeUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { active } = req.body

    const user = await adminService.changeUserStatus(id, active)

    res.status(200).json({
      status: 'success',
      message: `Đã cập nhật trạng thái tài khoản thành: ${active}`,
      data: user
    })
  } catch (error) {
    next(error)
  }
}

const deletePortfolioByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params

    await adminService.deletePortfolioByAdmin(id)

    res.status(200).json({
      status: 'success',
      message: 'Đã gỡ bỏ tác phẩm vi phạm thành công'
    })
  } catch (error) {
    next(error)
  }
}

export const adminController = {
  getSystemStats,
  getAllUsers,
  changeUserStatus,
  deletePortfolioByAdmin
}
