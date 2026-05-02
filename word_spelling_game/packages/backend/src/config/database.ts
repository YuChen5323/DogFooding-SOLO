import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

const DB_HOST = process.env.DATABASE_HOST || 'localhost'
const DB_PORT = parseInt(process.env.DATABASE_PORT || '5432')
const DB_NAME = process.env.DATABASE_NAME || 'word_spelling_game'
const DB_USER = process.env.DATABASE_USER || 'postgres'
const DB_PASSWORD = process.env.DATABASE_PASSWORD || 'password'

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
})

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate()
    console.log('✓ Database connection established successfully')
    
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true })
      console.log('✓ Database models synced')
    }
  } catch (error) {
    console.error('✗ Unable to connect to the database:', error)
    process.exit(1)
  }
}

export default sequelize
