import express from 'express'

import authRoutes from './authRoutes.js'
import { portfolioRoutes } from './portfolioRoutes.js'
import aiRoutes from './aiRoutes.js'
import commentRoutes from './commentRoutes.js'
import userRoutes from './userRoutes.js'
import notificationRoutes from './notificationRoutes.js'
import adminRoutes from './adminRoutes.js'

const Router = express.Router()

Router.use('/auth', authRoutes)
Router.use('/portfolios', portfolioRoutes)
Router.use('/ai', aiRoutes)
Router.use('/comments', commentRoutes)
Router.use('/users', userRoutes)
Router.use('/notifications', notificationRoutes)
Router.use('/admin', adminRoutes)

export const APIs_V1 = Router