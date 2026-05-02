import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth'
import levelRoutes from './routes/levels'
import leaderboardRoutes from './routes/leaderboard'
import sequelize from './config/database'
import Word from './models/Word'
import Level from './models/Level'

dotenv.config()

const app: Application = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/levels', levelRoutes)
app.use('/api/leaderboard', leaderboardRoutes)

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err)
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      message: 'Invalid token',
    })
  }

  return res.status(500).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  })
})

app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    message: 'Endpoint not found',
  })
})

export const initializeDatabase = async () => {
  try {
    await sequelize.authenticate()
    console.log('Database connection has been established successfully.')

    const isProduction = process.env.NODE_ENV === 'production'
    if (!isProduction) {
      await sequelize.sync({ alter: true })
    } else {
      await sequelize.sync()
    }
    console.log('Database models synced successfully.')

    await seedDatabase()
    console.log('Database seeded successfully.')
  } catch (error) {
    console.error('Unable to connect to the database:', error)
    throw error
  }
}

async function seedDatabase() {

  const wordCount = await Word.count()
  if (wordCount > 0) {
    console.log('Database already has words, skipping seed.')
    return
  }

  const sampleWords = [
    {
      text: 'apple',
      pronunciation: '/ˈæpl/',
      translation: { en: 'apple', ja: 'りんご', zh: '苹果' },
      difficulty: 1,
      category: 'food',
      hints: ['A red fruit', 'Keeps doctor away'],
    },
    {
      text: 'banana',
      pronunciation: '/bəˈnænə/',
      translation: { en: 'banana', ja: 'バナナ', zh: '香蕉' },
      difficulty: 1,
      category: 'food',
      hints: ['A yellow fruit', 'Monkeys love it'],
    },
    {
      text: 'cat',
      pronunciation: '/kæt/',
      translation: { en: 'cat', ja: '猫', zh: '猫' },
      difficulty: 1,
      category: 'animals',
      hints: ['A pet that says meow', 'Likes to chase mice'],
    },
    {
      text: 'dog',
      pronunciation: '/dɔːɡ/',
      translation: { en: 'dog', ja: '犬', zh: '狗' },
      difficulty: 1,
      category: 'animals',
      hints: ['A pet that barks', "Man's best friend"],
    },
    {
      text: 'red',
      pronunciation: '/red/',
      translation: { en: 'red', ja: '赤', zh: '红色' },
      difficulty: 1,
      category: 'colors',
      hints: ['The color of blood', 'A primary color'],
    },
    {
      text: 'blue',
      pronunciation: '/bluː/',
      translation: { en: 'blue', ja: '青', zh: '蓝色' },
      difficulty: 1,
      category: 'colors',
      hints: ['The color of sky', 'A primary color'],
    },
    {
      text: 'one',
      pronunciation: '/wʌn/',
      translation: { en: 'one', ja: '一', zh: '一' },
      difficulty: 1,
      category: 'numbers',
      hints: ['The first number', '1 in digits'],
    },
    {
      text: 'two',
      pronunciation: '/tuː/',
      translation: { en: 'two', ja: '二', zh: '二' },
      difficulty: 1,
      category: 'numbers',
      hints: ['After one', '2 in digits'],
    },
    {
      text: 'elephant',
      pronunciation: '/ˈelɪfənt/',
      translation: { en: 'elephant', ja: '象', zh: '大象' },
      difficulty: 2,
      category: 'animals',
      hints: ['The largest land animal', 'Has a trunk'],
    },
    {
      text: 'giraffe',
      pronunciation: '/dʒəˈrɑːf/',
      translation: { en: 'giraffe', ja: 'キリン', zh: '长颈鹿' },
      difficulty: 2,
      category: 'animals',
      hints: ['The tallest animal', 'Has a long neck'],
    },
    {
      text: 'computer',
      pronunciation: '/kəmˈpjuːtər/',
      translation: { en: 'computer', ja: 'コンピューター', zh: '电脑' },
      difficulty: 2,
      category: 'beginner',
      hints: ['A programmable machine', 'You are using one now'],
    },
    {
      text: 'beautiful',
      pronunciation: '/ˈbjuːtɪfəl/',
      translation: { en: 'beautiful', ja: '美しい', zh: '美丽的' },
      difficulty: 3,
      category: 'intermediate',
      hints: ['Pleasing to the senses', 'Opposite of ugly'],
    },
    {
      text: 'adventure',
      pronunciation: '/ədˈventʃər/',
      translation: { en: 'adventure', ja: '冒険', zh: '冒险' },
      difficulty: 3,
      category: 'intermediate',
      hints: ['An exciting experience', 'Think Indiana Jones'],
    },
    {
      text: 'knowledge',
      pronunciation: '/ˈnɒlɪdʒ/',
      translation: { en: 'knowledge', ja: '知識', zh: '知识' },
      difficulty: 4,
      category: 'advanced',
      hints: ['Information and skills acquired through experience', 'Power'],
    },
    {
      text: 'unprecedented',
      pronunciation: '/ʌnˈpresɪdentɪd/',
      translation: { en: 'unprecedented', ja: '前例のない', zh: '前所未有的' },
      difficulty: 5,
      category: 'advanced',
      hints: ['Never done or known before', 'Without precedent'],
    },
  ]

  for (const wordData of sampleWords) {
    await Word.create(wordData as any)
  }

  const categories = ['beginner', 'intermediate', 'advanced', 'animals', 'colors', 'food', 'numbers']
  let orderCounter = 0

  for (const category of categories) {
    for (let i = 1; i <= 10; i++) {
      await Level.create({
        name: {
          en: `Level ${i}`,
          ja: `レベル ${i}`,
          zh: `第 ${i} 关`,
        },
        description: {
          en: `Practice spelling words in ${category} category`,
          ja: `${category}カテゴリの単語を練習します`,
          zh: `练习 ${category} 类别的单词拼写`,
        },
        difficulty: getDifficultyForCategory(category),
        category,
        wordIds: [],
        wordCount: 8 + i,
        timeLimit: 60 + (5 - getDifficultyForCategory(category)) * 10,
        order: orderCounter++,
      } as any)
    }
  }
}

function getDifficultyForCategory(category: string): number {
  const map: Record<string, number> = {
    beginner: 1,
    numbers: 1,
    colors: 1,
    animals: 1,
    food: 1,
    intermediate: 2,
    advanced: 4,
  }
  return map[category] || 2
}

export default app
