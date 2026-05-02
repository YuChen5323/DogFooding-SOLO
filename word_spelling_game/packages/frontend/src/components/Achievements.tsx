import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../store'

interface Achievement {
  id: string
  name: Record<string, string>
  description: Record<string, string>
  icon: string
  unlocked: boolean
  unlockedAt?: string
  progress?: number
  total?: number
}

function Achievements() {
  const navigate = useNavigate()
  const { language } = useAppSelector((state) => state.settings)
  const { isAuthenticated } = useAppSelector((state) => state.user)

  const mockAchievements: Achievement[] = [
    {
      id: 'first_word',
      name: { en: 'First Steps', ja: '最初の一歩', zh: '第一步' },
      description: {
        en: 'Spell your first word correctly',
        ja: '最初の単語を正しくスペル',
        zh: '正确拼写第一个单词',
      },
      icon: '🌟',
      unlocked: true,
      unlockedAt: '2024-01-10',
    },
    {
      id: 'level_complete',
      name: { en: 'Level Master', ja: 'レベルマスター', zh: '关卡大师' },
      description: {
        en: 'Complete any level with 3 stars',
        ja: '3つ星で任意のレベルをクリア',
        zh: '以3星完成任意关卡',
      },
      icon: '⭐',
      unlocked: true,
      unlockedAt: '2024-01-11',
    },
    {
      id: 'combo_5',
      name: { en: 'Combo King', ja: 'コンボキング', zh: '连击之王' },
      description: {
        en: 'Get a 5x combo in any game mode',
        ja: '任意のゲームモードで5xコンボ',
        zh: '在任意游戏模式中获得5连击',
      },
      icon: '🔥',
      unlocked: true,
      unlockedAt: '2024-01-12',
    },
    {
      id: 'words_50',
      name: { en: 'Word Collector', ja: '単語コレクター', zh: '单词收藏家' },
      description: {
        en: 'Spell 50 words correctly',
        ja: '50個の単語を正しくスペル',
        zh: '正确拼写50个单词',
      },
      icon: '📚',
      unlocked: false,
      progress: 35,
      total: 50,
    },
    {
      id: 'speed_master',
      name: { en: 'Speed Demon', ja: 'スピードデーモン', zh: '速度恶魔' },
      description: {
        en: 'Score over 1000 points in Speed Spell mode',
        ja: 'スピードスペルモードで1000点以上',
        zh: '在计时速拼模式中获得1000分以上',
      },
      icon: '⚡',
      unlocked: false,
      progress: 750,
      total: 1000,
    },
    {
      id: 'puzzle_perfect',
      name: { en: 'Puzzle Perfect', ja: 'パズルパーフェクト', zh: '完美拼图' },
      description: {
        en: 'Complete a puzzle without any mistakes',
        ja: 'ミスなしでパズルを完成',
        zh: '零错误完成拼图',
      },
      icon: '🧩',
      unlocked: false,
    },
    {
      id: 'falling_survivor',
      name: { en: 'Falling Survivor', ja: '落下サバイバー', zh: '降落幸存者' },
      description: {
        en: 'Reach level 10 in Falling Letters mode',
        ja: '落下レターズモードでレベル10に到達',
        zh: '在降落字母模式中到达第10级',
      },
      icon: '🎯',
      unlocked: false,
    },
    {
      id: 'daily_streak_7',
      name: { en: 'Week Warrior', ja: 'ウィークウォリアー', zh: '周战士' },
      description: {
        en: 'Play for 7 consecutive days',
        ja: '7日間連続でプレイ',
        zh: '连续7天玩游戏',
      },
      icon: '📅',
      unlocked: false,
      progress: 3,
      total: 7,
    },
    {
      id: 'all_modes',
      name: { en: 'Jack of All Trades', ja: 'オールラウンダー', zh: '全能玩家' },
      description: {
        en: 'Complete at least one level in each game mode',
        ja: '各ゲームモードで少なくとも1つのレベルをクリア',
        zh: '在每个游戏模式中至少完成1个关卡',
      },
      icon: '🎮',
      unlocked: false,
    },
  ]

  const unlockedCount = mockAchievements.filter((a) => a.unlocked).length
  const totalCount = mockAchievements.length

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full p-4 overflow-auto"
    >
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Menu
        </button>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-game-card-bg rounded-2xl p-6 shadow-2xl"
        >
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🏆</div>
            <h1 className="text-3xl font-bold mb-2">Achievements</h1>
            <div className="text-gray-400">
              {unlockedCount} / {totalCount} Unlocked
            </div>
            <div className="w-full bg-game-bg rounded-full h-3 mt-3">
              <div
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all"
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              ></div>
            </div>
          </div>

          {!isAuthenticated && (
            <div className="mb-6 p-4 bg-game-bg rounded-xl text-center">
              <p className="text-gray-400 mb-3">Login to track your achievements!</p>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors"
              >
                Login
              </button>
            </div>
          )}

          <div className="space-y-3">
            {mockAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl border transition-all ${
                  achievement.unlocked
                    ? 'bg-game-bg border-primary-500/30'
                    : 'bg-game-bg/50 border-gray-700/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-primary-500 to-secondary-500'
                        : 'bg-gray-700 grayscale'
                    }`}
                  >
                    {achievement.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${achievement.unlocked ? 'text-white' : 'text-gray-500'}`}>
                        {achievement.name[language as keyof typeof achievement.name] || achievement.name.en}
                      </h3>
                      {achievement.unlocked && <span className="text-green-400 text-sm">✓</span>}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {achievement.description[language as keyof typeof achievement.description] ||
                        achievement.description.en}
                    </p>

                    {!achievement.unlocked && achievement.progress !== undefined && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>
                            {achievement.progress} / {achievement.total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full transition-all"
                            style={{ width: `${(achievement.progress / achievement.total!) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {achievement.unlockedAt && (
                    <div className="text-right text-xs text-gray-500">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Achievements
