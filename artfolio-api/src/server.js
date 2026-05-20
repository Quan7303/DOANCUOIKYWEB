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

  app.use(cors())
  app.use(express.json())
  app.use(cookieParser())

  app.get('/', (req, res) => {
    console.log(mapOrder(
      [ { id: 'id-1', name: 'One' },
        { id: 'id-2', name: 'Two' },
        { id: 'id-3', name: 'Three' } ],
      ['id-3', 'id-1', 'id-2'],
      'id'
    ))
    res.end('<h1>Welcome to ArtFolio API Server!</h1><hr>')
  })

  app.use('/v1', APIs_V1)

  await connectDatabase()

  app.use(errorHandlingMiddleware)

  app.listen(env.APP_PORT, env.APP_HOST, () => {
    console.log(`Hello, ArtFolio Server is running at http://${env.APP_HOST}:${env.APP_PORT}/`)
  })
}

startServer().catch(error => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
