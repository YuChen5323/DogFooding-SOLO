import dotenv from 'dotenv'
import app, { initializeDatabase } from './app'

dotenv.config()

const PORT = process.env.PORT || 3000

async function startServer() {
  try {
    console.log('Starting Word Spelling Game API Server...')
    console.log('Environment:', process.env.NODE_ENV || 'development')

    await initializeDatabase()

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`)
      console.log(`📡 API endpoint: http://localhost:${PORT}/api`)
      console.log(`🔍 Health check: http://localhost:${PORT}/api/health`)
      console.log('✅ Server started successfully!')
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

process.on('unhandledRejection', (error: Error) => {
  console.error('Unhandled Rejection:', error)
})

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error)
})

startServer()
