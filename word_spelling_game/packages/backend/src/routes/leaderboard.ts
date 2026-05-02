import { Router, Response } from 'express'
import { Op } from 'sequelize'
import LeaderboardEntry from '../models/LeaderboardEntry'
import User from '../models/User'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

type GameMode = 'falling' | 'puzzle' | 'speed' | 'all'
type LeaderboardPeriod = 'daily' | 'weekly' | 'all_time'
type LeaderboardType = 'global' | 'friends'

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      mode = 'all',
      period = 'all_time',
      type = 'global',
      limit = 50,
    } = req.query

    const gameMode = mode as GameMode
    const leaderboardPeriod = period as LeaderboardPeriod
    const leaderboardType = type as LeaderboardType
    const limitNum = Math.min(parseInt(limit as string) || 50, 100)

    let whereClause: any = {
      gameMode: gameMode,
      period: leaderboardPeriod,
    }

    const dateFilter = getDateFilter(leaderboardPeriod)
    if (dateFilter) {
      whereClause.date = dateFilter
    }

    if (leaderboardType === 'friends' && req.userId) {
      const user = await User.findByPk(req.userId)
      if (user && user.friends.length > 0) {
        whereClause.userId = {
          [Op.in]: user.friends,
        }
      }
    }

    const entries = await LeaderboardEntry.findAll({
      where: whereClause,
      order: [['score', 'DESC']],
      limit: limitNum,
      attributes: ['id', 'userId', 'username', 'avatar', 'score', 'date'],
    })

    let userRank: { rank: number; entry: any } | null = null

    if (req.userId) {
      const userEntry = await LeaderboardEntry.findOne({
        where: {
          ...whereClause,
          userId: req.userId,
        },
      })

      if (userEntry) {
        const rank = await LeaderboardEntry.count({
          where: {
            ...whereClause,
            score: {
              [Op.gt]: userEntry.score,
            },
          },
        })

        userRank = {
          rank: rank + 1,
          entry: {
            id: userEntry.id,
            userId: userEntry.userId,
            username: userEntry.username,
            avatar: userEntry.avatar,
            score: userEntry.score,
            date: userEntry.date,
          },
        }
      }
    }

    return res.status(200).json({
      mode: gameMode,
      period: leaderboardPeriod,
      type: leaderboardType,
      entries: entries.map((e, index) => ({
        ...e.toJSON(),
        rank: index + 1,
      })),
      userRank,
    })
  } catch (error) {
    console.error('Get leaderboard error:', error)
    return res.status(500).json({
      message: 'Internal server error',
    })
  }
})

router.post('/submit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const user = req.user

    if (!userId || !user) {
      return res.status(401).json({
        message: 'Authentication required',
      })
    }

    const { score, mode = 'all' } = req.body

    if (!score || score <= 0) {
      return res.status(400).json({
        message: 'Invalid score',
      })
    }

    const gameMode = mode as GameMode

    const userData = await User.findByPk(userId)

    const periods: LeaderboardPeriod[] = ['daily', 'weekly', 'all_time']

    for (const period of periods) {
      let whereClause: any = {
        userId,
        gameMode,
        period,
      }

      const dateFilter = getDateFilter(period)
      if (dateFilter) {
        whereClause.date = dateFilter
      }

      const existingEntry = await LeaderboardEntry.findOne({
        where: whereClause,
      })

      if (existingEntry) {
        if (score > existingEntry.score) {
          existingEntry.score = score
          existingEntry.date = new Date()
          await existingEntry.save()
        }
      } else {
        await LeaderboardEntry.create({
          userId,
          username: userData?.username || user.username,
          avatar: userData?.avatar,
          score,
          gameMode,
          period,
          date: new Date(),
        })
      }
    }

    if (userData && score > 0) {
      userData.experience += Math.floor(score / 10)
      
      const levelThreshold = userData.level * 100
      if (userData.experience >= levelThreshold) {
        userData.level += 1
        userData.experience -= levelThreshold
        userData.coins += 50
      }

      await userData.save()
    }

    return res.status(200).json({
      message: 'Score submitted successfully',
      score,
      mode: gameMode,
      user: userData?.toJSON(),
    })
  } catch (error) {
    console.error('Submit score error:', error)
    return res.status(500).json({
      message: 'Internal server error',
    })
  }
})

function getDateFilter(period: LeaderboardPeriod): any {
  const now = new Date()
  
  switch (period) {
    case 'daily':
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return {
        [Op.gte]: today,
        [Op.lt]: tomorrow,
      }

    case 'weekly':
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      return {
        [Op.gte]: weekStart,
        [Op.lt]: weekEnd,
      }

    case 'all_time':
    default:
      return null
  }
}

export default router
