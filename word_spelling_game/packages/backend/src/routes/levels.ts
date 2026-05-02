import { Router, Request, Response } from 'express'
import { Op } from 'sequelize'
import Level from '../models/Level'
import Word from '../models/Word'
import { optionalAuthMiddleware } from '../middleware/auth'

const router = Router()

router.get('/categories', optionalAuthMiddleware, async (_req: Request, res: Response) => {
  try {
    const levels = await Level.findAll({
      order: [['category', 'ASC'], ['order', 'ASC']],
    })

    const categories: Record<string, any> = {}
    
    for (const level of levels) {
      if (!categories[level.category]) {
        categories[level.category] = {
          id: level.category,
          name: {
            en: level.category.charAt(0).toUpperCase() + level.category.slice(1),
            ja: level.category,
            zh: level.category,
          },
          icon: getCategoryIcon(level.category),
          levels: [],
          unlocked: true,
        }
      }

      categories[level.category].levels.push({
        id: level.id,
        name: level.name,
        description: level.description,
        difficulty: level.difficulty,
        wordCount: level.wordCount,
        timeLimit: level.timeLimit,
        stars: 0,
        unlocked: true,
        completed: false,
      })
    }

    const categoryList = Object.values(categories)
    
    return res.status(200).json(categoryList)
  } catch (error) {
    console.error('Get categories error:', error)
    return res.status(500).json({
      message: 'Internal server error',
    })
  }
})

router.get('/:levelId/words', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { levelId } = req.params

    const level = await Level.findByPk(levelId)

    if (!level) {
      return res.status(404).json({
        message: 'Level not found',
      })
    }

    let words: Word[] = []

    if (level.wordIds.length > 0) {
      words = await Word.findAll({
        where: {
          id: {
            [Op.in]: level.wordIds,
          },
        },
      })
    }

    if (words.length === 0) {
      words = await Word.findAll({
        where: {
          difficulty: level.difficulty,
          category: level.category === 'all' ? undefined : level.category,
        },
        limit: level.wordCount,
        order: [['text', 'ASC']],
      })
    }

    return res.status(200).json(words)
  } catch (error) {
    console.error('Get level words error:', error)
    return res.status(500).json({
      message: 'Internal server error',
    })
  }
})

router.get('/:levelId', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { levelId } = req.params

    const level = await Level.findByPk(levelId)

    if (!level) {
      return res.status(404).json({
        message: 'Level not found',
      })
    }

    return res.status(200).json({
      id: level.id,
      name: level.name,
      description: level.description,
      difficulty: level.difficulty,
      category: level.category,
      wordCount: level.wordCount,
      timeLimit: level.timeLimit,
      order: level.order,
    })
  } catch (error) {
    console.error('Get level error:', error)
    return res.status(500).json({
      message: 'Internal server error',
    })
  }
})

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    beginner: '🌱',
    intermediate: '🌿',
    advanced: '🌳',
    animals: '🐾',
    colors: '🎨',
    food: '🍕',
    numbers: '🔢',
    all: '📚',
  }
  return icons[category] || '📖'
}

export default router
