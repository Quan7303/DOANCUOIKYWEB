import express from 'express'
import { authRoutes } from './authRoutes.js'
import { portfolioRoutes } from './portfolioRoutes.js'
import aiRoutes from './aiRoutes.js'
import commentRoutes from './commentRoutes.js'
import userRoutes from './userRoutes.js'

const Router = express.Router()

Router.use('/auth', authRoutes)
Router.use('/portfolios', portfolioRoutes)
// /api/ai/*
Router.use('/ai', aiRoutes)
// /api/comments/*
Router.use('/comments', commentRoutes)

// /api/users/*
Router.use('/users', userRoutes)
export const APIs_V1 = Router
