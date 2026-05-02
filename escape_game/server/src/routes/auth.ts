import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = Router();

const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key-here-change-in-production',
    { expiresIn: '7d' }
  );
};

router.post(
  '/register',
  [
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('用户名长度应为3-30个字符'),
    body('email').isEmail().withMessage('请输入有效的邮箱'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('密码至少6个字符')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password } = req.body;

      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(400).json({
          message:
            existingUser.email === email
              ? '该邮箱已被注册'
              : '该用户名已被使用'
        });
      }

      const user = new User({ username, email, password });
      await user.save();

      const token = generateToken(user.id);

      res.status(201).json({
        message: '注册成功',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      console.error('注册错误:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('请输入有效的邮箱'),
    body('password').exists().withMessage('请输入密码')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: '邮箱或密码错误' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: '邮箱或密码错误' });
      }

      const token = generateToken(user.id);

      res.json({
        message: '登录成功',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      console.error('登录错误:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }
);

export default router;
