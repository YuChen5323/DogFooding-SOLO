import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Achievement, { achievementDefinitions } from '../models/Achievement';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const unlockedAchievements = await Achievement.find({ userId: req.userId });
    const unlockedIds = unlockedAchievements.map(a => a.achievementId);

    const achievements = achievementDefinitions.map(def => ({
      ...def,
      unlocked: unlockedIds.includes(def.id),
      unlockedAt: unlockedAchievements.find(a => a.achievementId === def.id)?.unlockedAt || null
    }));

    res.json({ achievements });
  } catch (error) {
    console.error('获取成就错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post(
  '/unlock',
  [body('achievementId').exists().withMessage('成就ID不能为空')],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { achievementId } = req.body;

      const achievementDef = achievementDefinitions.find(a => a.id === achievementId);
      if (!achievementDef) {
        return res.status(404).json({ message: '成就不存在' });
      }

      const existingAchievement = await Achievement.findOne({
        userId: req.userId,
        achievementId
      });

      if (existingAchievement) {
        return res.json({
          message: '成就已解锁',
          achievement: {
            ...achievementDef,
            unlocked: true,
            unlockedAt: existingAchievement.unlockedAt
          }
        });
      }

      const achievement = new Achievement({
        userId: req.userId,
        achievementId
      });
      await achievement.save();

      res.status(201).json({
        message: '成就已解锁',
        achievement: {
          ...achievementDef,
          unlocked: true,
          unlockedAt: achievement.unlockedAt
        }
      });
    } catch (error) {
      console.error('解锁成就错误:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }
);

router.get('/definitions', async (_req: AuthRequest, res: Response) => {
  try {
    res.json({ achievements: achievementDefinitions });
  } catch (error) {
    console.error('获取成就定义错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
