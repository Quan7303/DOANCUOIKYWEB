import mongoose from 'mongoose'
import { env } from './environment.js'

export const connectDatabase = async () => {
  try {
    // Kết hợp URI và Database Name
    const connectionString = `${env.MONGODB_URI}/${env.DATABASE_NAME}`
    console.log(`Connecting to MongoDB at: ${env.MONGODB_URI} (DB: ${env.DATABASE_NAME})...`)

    await mongoose.connect(connectionString)

    console.log('MongoDB connected successfully!')
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message)
    process.exit(1)
  }
}

export const closeDatabase = async () => {
  await mongoose.connection.close()
  console.log('MongoDB connection closed.')
}
