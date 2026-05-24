import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { initSocket } from './sockets/index.js'

import { env } from './config/environment.js'
import { connectDatabase } from './config/mongodb.js'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware.js'
import { APIs_V1 } from './routes/v1/index.js'
import { mapOrder } from './utils/sorts.js'

// ================= SOCKET + APP INIT =================
const app = express()
const httpServer = http.createServer(app)

const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean)

// Socket.io init
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
})

app.set('io', io)

// Khởi tạo xử lý socket events
initSocket(io)

// ================= MIDDLEWARE =================
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
)

app.use(express.json())
app.use(cookieParser())

// ================= ROUTES =================
app.get('/', (req, res) => {
  console.log(
    mapOrder(
      [
        { id: 'id-1', name: 'One' },
        { id: 'id-2', name: 'Two' },
        { id: 'id-3', name: 'Three' }
      ],
      ['id-3', 'id-1', 'id-2'],
      'id'
    )
  )

  res.end('<h1>Welcome to ArtFolio API Server!</h1><hr>')
})

app.use('/api', APIs_V1)

// ================= ERROR HANDLER =================
app.use(errorHandlingMiddleware)

// ================= START SERVER =================
const startServer = async () => {
  await connectDatabase()

  httpServer.listen(env.APP_PORT, () => {
    console.log(`Server running at http://localhost:${env.APP_PORT}`)
    console.log('Socket.io initialized')
  })
}

startServer().catch(error => {
  console.error('Failed to start server:', error)
  process.exit(1)
})