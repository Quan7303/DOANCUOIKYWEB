import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { env } from './config/environment.js'
import { connectDatabase } from './config/mongodb.js'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware.js'
import { APIs_V1 } from './routes/v1/index.js'
import { mapOrder } from './utils/sorts.js'



const startServer = async () => {
  const app = express()

  // Cấu hình Express Middlewares
  app.use(cors())
  app.use(express.json())
  app.use(cookieParser())


  // Route kiểm tra sức khỏe hệ thống (Health check)
  app.get('/', (req, res) => {
    // Giữ nguyên đoạn test mapOrder của boilerplate
    console.log(mapOrder(
      [ { id: 'id-1', name: 'One' },
        { id: 'id-2', name: 'Two' },
        { id: 'id-3', name: 'Three' } ],
      ['id-3', 'id-1', 'id-2'],
      'id'
    ))
    res.end('<h1>Welcome to ArtFolio API Server!</h1><hr>')
  })

  // Đăng ký API v1
  app.use('/v1', APIs_V1)

  // Đợi kết nối MongoDB Atlas thành công rồi mới khởi chạy Server Express
  await connectDatabase()

  // Middleware xử lý lỗi tập trung (Luôn đặt ở dưới cùng của hàng đợi middleware)
  app.use(errorHandlingMiddleware)

  app.listen(env.APP_PORT, env.APP_HOST, () => {
    console.log(`Hello, ArtFolio Server is running at http://${env.APP_HOST}:${env.APP_PORT}/`)
  })
}

// Khởi động hệ thống
startServer().catch(error => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
