import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import { Op } from 'sequelize'
import User from '../models/User'
import { authMiddleware, generateToken, AuthRequest } from '../middleware/auth'

const router = Router()
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10')

router.post(
  '/register',
  [
    body('username')
      .isLength({ min: 2, max: 50 })
      .withMessage('Username must be between 2 and 50 characters'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        })
      }

      const { username, email, password } = req.body

      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email }, { username }],
        },
      })

      if (existingUser) {
        return res.status(400).json({
          message: 'User with this email or username already exists',
        })
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

      const user = await User.create({
        username,
        email,
        password: hashedPassword,
      })

      const token = generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
      })

      return res.status(201).json({
        message: 'User registered successfully',
        token,
        user: user.toJSON(),
      })
    } catch (error) {
      console.error('Registration error:', error)
      return res.status(500).json({
        message: 'Internal server error during registration',
      })
    }
  }
)

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').exists().withMessage('Password is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        })
      }

      const { email, password } = req.body

      const user = await User.findOne({
        where: { email },
      })

      if (!user) {
        return res.status(401).json({
          message: 'Invalid email or password',
        })
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        return res.status(401).json({
          message: 'Invalid email or password',
        })
      }

      user.lastLogin = new Date()
      await user.save()

      const token = generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
      })

      return res.status(200).json({
        message: 'Login successful',
        token,
        user: user.toJSON(),
      })
    } catch (error) {
      console.error('Login error:', error)
      return res.status(500).json({
        message: 'Internal server error during login',
      })
    }
  }
)

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({
        message: 'Authentication required',
      })
    }

    const user = await User.findByPk(userId)

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    return res.status(200).json(user.toJSON())
  } catch (error) {
    console.error('Get me error:', error)
    return res.status(500).json({
      message: 'Internal server error',
    })
  }
})

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({
        message: 'Authentication required',
      })
    }

    const user = await User.findByPk(userId)

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    const { username, avatar } = req.body

    if (username) {
      const existingUser = await User.findOne({
        where: {
          username,
          id: { [Op.ne]: userId },
        },
      })

      if (existingUser) {
        return res.status(400).json({
          message: 'Username already taken',
        })
      }

      user.username = username
    }

    if (avatar !== undefined) {
      user.avatar = avatar
    }

    await user.save()

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: user.toJSON(),
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return res.status(500).json({
      message: 'Internal server error',
    })
  }
})

export default router
