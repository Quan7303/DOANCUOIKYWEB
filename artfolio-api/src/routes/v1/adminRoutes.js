import express from 'express'
import { adminController } from '~/controllers/adminController.js'
import { protect, restrictTo } from '~/middlewares/authMiddleware.js'

const Router = express.Router()

// Tất cả route dưới đây đều yêu cầu đăng nhập và có role là admin
Router.use(protect)
Router.use(restrictTo('admin'))

Router.get('/stats', adminController.getSystemStats)

Router.route('/users')
  .get(adminController.getAllUsers)

Router.route('/users/:id/status')
  .patch(adminController.changeUserStatus)

Router.route('/portfolios/:id')
  .delete(adminController.deletePortfolioByAdmin)

export default Router
