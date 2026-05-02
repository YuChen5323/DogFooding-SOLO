import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import Save, { IGameState } from '../models/Save';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

const defaultGameState: IGameState = {
  currentRoom: 'entrance',
  inventory: [],
  flags: {},
  puzzlesSolved: [],
  achievementsUnlocked: [],
  diaryEntries: [],
  playerPosition: { x: 400, y: 450 },
  playTime: 0,
  lastSaved: new Date()
};

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const saves = await Save.find({ userId: req.userId })
      .sort({ updatedAt: -1 });

    res.json({ saves });
  } catch (error) {
    console.error('获取存档错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get(
  '/:slotNumber',
  [param('slotNumber').isInt({ min: 1, max: 5 })],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const slotNumber = parseInt(req.params.slotNumber);
      const save = await Save.findOne({
        userId: req.userId,
        slotNumber
      });

      if (!save) {
        return res.status(404).json({ message: '存档不存在' });
      }

      res.json({ save });
    } catch (error) {
      console.error('获取存档错误:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }
);

router.post(
  '/:slotNumber',
  [
    param('slotNumber').isInt({ min: 1, max: 5 }),
    body('gameState').exists().withMessage('游戏状态不能为空')
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const slotNumber = parseInt(req.params.slotNumber);
      const gameState: IGameState = {
        ...req.body.gameState,
        lastSaved: new Date()
      };

      const existingSave = await Save.findOne({
        userId: req.userId,
        slotNumber
      });

      if (existingSave) {
        existingSave.gameState = gameState;
        await existingSave.save();
        res.json({ message: '存档已更新', save: existingSave });
      } else {
        const save = new Save({
          userId: req.userId,
          slotNumber,
          gameState
        });
        await save.save();
        res.status(201).json({ message: '存档已创建', save });
      }
    } catch (error) {
      console.error('保存存档错误:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }
);

router.delete(
  '/:slotNumber',
  [param('slotNumber').isInt({ min: 1, max: 5 })],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const slotNumber = parseInt(req.params.slotNumber);
      const result = await Save.findOneAndDelete({
        userId: req.userId,
        slotNumber
      });

      if (!result) {
        return res.status(404).json({ message: '存档不存在' });
      }

      res.json({ message: '存档已删除' });
    } catch (error) {
      console.error('删除存档错误:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }
);

export default router;
