import mongoose from 'mongoose'

const resolveMongoUri = (): string => {
  const explicitCandidates = [
    { key: 'MONGODB_URI', value: process.env.MONGODB_URI },
    { key: 'MONGODB_ATLAS_URI', value: process.env.MONGODB_ATLAS_URI },
    { key: 'MONGO_URI', value: process.env.MONGO_URI },
    { key: 'MONGO_URL', value: process.env.MONGO_URL },
    { key: 'MONGODB_URL', value: process.env.MONGODB_URL },
    { key: 'ATLAS_URI', value: process.env.ATLAS_URI },
    { key: 'ATLAS_URL', value: process.env.ATLAS_URL },
    { key: 'DATABASE_URL', value: process.env.DATABASE_URL },
    { key: 'DATABASE_URI', value: process.env.DATABASE_URI },
  ]

  let found = explicitCandidates.find((c) => Boolean(c.value))
  if (!found) {
    // Fallback: auto-detect from any env key containing mongo/atlas + uri/url
    const dynamicKeys = Object.keys(process.env)
      .filter((k) => /(MONGO|ATLAS|DB)/i.test(k) && /(URI|URL|CONN)/i.test(k))
      .map((k) => ({ key: k, value: process.env[k] as string | undefined }))
      .filter((c) => Boolean(c.value))

    // Prefer values that look like a MongoDB connection string
    found = dynamicKeys.find((c) => /mongodb(\+srv)?:\/\//i.test(c.value || '')) || dynamicKeys[0]

  }

  if (found?.value) {
    return found.value
  }

  console.warn('[DB] No MongoDB env var found, using default: mongodb://localhost:27017/ai-interview-platform')
  return 'mongodb://localhost:27017/ai-interview-platform'
}

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = resolveMongoUri()

    await mongoose.connect(mongoURI)
    console.log('[DB] MongoDB connected')

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('[DB] Connection error:', err.message)
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] Disconnected')
    })

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      process.exit(0)
    })

  } catch (error) {
    console.error('[DB] Connection failed:', error)
    process.exit(1)
  }
}

export { connectDB }
