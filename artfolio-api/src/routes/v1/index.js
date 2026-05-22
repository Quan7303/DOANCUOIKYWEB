import express from 'express'
import { authRoutes } from './authRoutes.js'
import { portfolioRoutes } from './portfolioRoutes.js'
import aiRoutes from './aiRoutes.js'

const Router = express.Router()

Router.use('/auth', authRoutes)
Router.use('/portfolios', portfolioRoutes)
// /api/ai/*
Router.use('/ai', aiRoutes)
export const APIs_V1 = Router
