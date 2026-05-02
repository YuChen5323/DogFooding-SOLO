import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = (process.env.JWT_SECRET || 'your-secret-key') as jwt.Secret

export interface AuthRequest extends Request {
  userId?: string
  user?: {
    id: string
    username: string
    email: string
  }
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        message: 'Authentication required',
      })
      return
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      res.status(401).json({
        message: 'Authentication token missing',
      })
      return
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string
      username: string
      email: string
    }

    req.userId = decoded.id
    req.user = decoded

    next()
  } catch (error) {
    res.status(401).json({
      message: 'Invalid or expired token',
    })
    return
  }
}

export const optionalAuthMiddleware = (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET) as {
          id: string
          username: string
          email: string
        }

        req.userId = decoded.id
        req.user = decoded
      }
    }

    next()
  } catch (error) {
    next()
  }
}

export const generateToken = (payload: {
  id: string
  username: string
  email: string
}): string => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  })
}

export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET)
}
