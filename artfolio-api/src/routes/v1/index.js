import express from 'express'
import { authRoutes } from './authRoutes.js'
import { portfolioRoutes } from './portfolioRoutes.js'

const Router = express.Router()

Router.use('/auth', authRoutes)
Router.use('/portfolios', portfolioRoutes)

export const APIs_V1 = Router
