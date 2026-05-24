import mongoose from 'mongoose'
import { env } from './environment.js'

const buildConnectionString = () => {
  if (!env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI in environment variables')
  }

  const uri = env.MONGODB_URI.trim()

  if (uri.includes('<db_password>')) {
    throw new Error('MONGODB_URI still contains <db_password>. Replace it with the real MongoDB password.')
  }

  return uri
}

export const connectDatabase = async () => {
  try {
    const connectionString = buildConnectionString()
    console.log(`Connecting to MongoDB at: ${env.MONGODB_URI} (DB: ${env.DATABASE_NAME})...`)

    await mongoose.connect(connectionString, {
      dbName: env.DATABASE_NAME || 'artfolio'
    })

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
