import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '@/store'
import { setCurrentLevel } from '@/store/slices/levelSlice'
import { Level } from '@/store/slices/levelSlice'

const mockCategories = [
  {
    id: 'beginner',
    name: { en: 'Beginner', ja: '初心者', zh: '初级' },
    icon: '🌱',
    levels: [
      {
        id: 'level-1-1',
        name: { en: 'First Words', ja: '最初の単語', zh: '入门单词' },
        description: { en: 'Learn basic 3-letter words', ja: '基本的な3文字の単語を学ぶ', zh: '学习基础3字母单词' },
        difficulty: 1,
        words: [],
        wordCount: 10,
        timeLimit: 60,
        stars: 3,
        unlocked: true,
        completed: true,
        bestScore: 850,
      },
      {
        id: 'level-1-2',
        name: { en: 'Animals', ja: '動物', zh: '动物' },
        description: { en: 'Learn animal names', ja: '動物の名前を学ぶ', zh: '学习动物名称' },
        difficulty: 1,
        words: [],
        wordCount: 12,
        timeLimit: 60,
        stars: 2,
        unlocked: true,
        completed: true,
        bestScore: 720,
      },
      {
        id: 'level-1-3',
        name: { en: 'Colors', ja: '色', zh: '颜色' },
        description: { en: 'Learn color words', ja: '色の単語を学ぶ', zh: '学习颜色单词' },
        difficulty: 1,
        words: [],
        wordCount: 10,
        timeLimit: 60,
        stars: 0,
        unlocked: true,
        completed: false,
      },
    ],
    unlocked: true,
  },
  {
    id: 'intermediate',
    name: { en: 'Intermediate', ja: '中級', zh: '中级' },
    icon: '🌿',
    levels: [
      {
        id: 'level-2-1',
        name: { en: 'Food & Drinks', ja: '食べ物と飲み物', zh: '食物与饮料' },
        description: { en: 'Learn food vocabulary', ja: '食べ物の語彙を学ぶ', zh: '学习食物词汇' },
        difficulty: 2,
        words: [],
        wordCount: 15,
        timeLimit: 90,
        stars: 0,
        unlocked: true,
        completed: false,
      },
      {
        id: 'level-2-2',
        name: { en: 'Numbers', ja: '数字', zh: '数字' },
        description: { en: 'Learn numbers in English', ja: '英語の数字を学ぶ', zh: '学习英语数字' },
        difficulty: 2,
        words: [],
        wordCount: 12,
        timeLimit: 90,
        stars: 0,
        unlocked: false,
        completed: false,
      },
    ],
    unlocked: true,
  },
  {
    id: 'advanced',
    name: { en: 'Advanced', ja: '上級', zh: '高级' },
    icon: '🌳',
    levels: [
      {
        id: 'level-3-1',
        name: { en: 'Business Terms', ja: 'ビジネス用語', zh: '商务术语' },
        description: { en: 'Professional vocabulary', ja: 'プロフェッショナルな語彙', zh: '专业词汇' },
        difficulty: 3,
        words: [],
        wordCount: 20,
        timeLimit: 120,
        stars: 0,
        unlocked: false,
        completed: false,
      },
    ],
    unlocked: false,
  },
]

const LevelSelect = () => {
  const { t, i18n } = useTranslation()
  const { mode } = useParams<{ mode: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { categories } = useAppSelector((state) => state.level)
  const currentLanguage = i18n.language as 'en' | 'ja' | 'zh'

  const [expandedCategory, setExpandedCategory] = useState<string | null>(mockCategories[0]?.id || null)

  const mockWordLists: Record<string, string[]> = {
    'level-1-1': ['cat', 'dog', 'sun', 'pen', 'box', 'hat', 'map', 'cup', 'bed', 'car'],
    'level-1-2': ['lion', 'tiger', 'bear', 'wolf', 'fox', 'deer', 'goat', 'cow', 'pig', 'hen', 'duck', 'fish'],
    'level-1-3': ['red', 'blue', 'green', 'yellow', 'pink', 'black', 'white', 'brown', 'purple', 'orange'],
    'level-2-1': ['apple', 'bread', 'cheese', 'coffee', 'juice', 'milk', 'pizza', 'soup', 'water', 'cake', 'egg', 'fish', 'meat', 'rice', 'tea'],
    'level-2-2': ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'],
    'level-3-1': ['company', 'business', 'meeting', 'office', 'manager', 'employee', 'project', 'deadline', 'budget', 'contract', 'client', 'partner', 'strategy', 'meeting', 'report', 'presentation', 'analytics', 'investment', 'revenue', 'profit'],
  }

  useEffect(() => {
    if (categories.length === 0) {
      // dispatch(fetchCategories())
    }
  }, [dispatch, categories.length])

  const handleLevelSelect = (level: Level) => {
    if (!level.unlocked) return

    dispatch(setCurrentLevel(level))
    const wordList = mockWordLists[level.id] || ['cat', 'dog', 'sun', 'pen', 'box']
    navigate(`/game/${mode}/${level.id}`, { state: { wordList } })
  }

  const renderStars = (count: number, maxStars: number = 3) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: maxStars }).map((_, i) => (
          <span
            key={i}
            className={`text-xl ${i < count ? 'text-yellow-400' : 'text-gray-600'}`}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  }

  return (
    <div className="w-full h-full flex flex-col p-4 overflow-y-auto">
      <motion.div
        className="w-full max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/game-modes')}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <span>←</span>
            <span>{t('common.back')}</span>
          </button>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-game-accent">
            {t('levels.categories')}
          </h1>
          <div className="w-20"></div>
        </motion.div>

        <div className="space-y-4">
          {mockCategories.map((category) => (
            <motion.div
              key={category.id}
              variants={itemVariants}
              className="card"
            >
              <div
                className={`flex items-center gap-4 cursor-pointer ${!category.unlocked ? 'opacity-50' : ''}`}
                onClick={() => category.unlocked && setExpandedCategory(
                  expandedCategory === category.id ? null : category.id
                )}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-3xl">
                  {category.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">
                    {category.name[currentLanguage] || category.name.en}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {category.levels.length} {t('game.level')}(s)
                  </p>
                </div>
                <div className="text-gray-400 text-2xl">
                  {expandedCategory === category.id ? '▲' : '▼'}
                </div>
              </div>

              {expandedCategory === category.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-primary-500/20"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.levels.map((level) => (
                      <motion.div
                        key={level.id}
                        whileHover={level.unlocked ? { scale: 1.02 } : {}}
                        whileTap={level.unlocked ? { scale: 0.98 } : {}}
                        onClick={() => handleLevelSelect(level)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          level.unlocked
                            ? level.completed
                              ? 'border-green-500/50 bg-green-500/10 cursor-pointer'
                              : 'border-primary-500/30 bg-primary-500/5 hover:border-primary-400 cursor-pointer'
                            : 'border-gray-700 bg-gray-800/50 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-lg">
                              {level.name[currentLanguage] || level.name.en}
                            </h4>
                            <p className="text-sm text-gray-400 mt-1">
                              {level.description[currentLanguage] || level.description.en}
                            </p>
                          </div>
                          {!level.unlocked && (
                            <span className="text-2xl">🔒</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          {renderStars(level.stars)}
                          <div className="text-sm text-gray-400">
                            {level.completed && level.bestScore && (
                              <span>{t('levels.bestScore')}: {level.bestScore}</span>
                            )}
                            {!level.completed && level.unlocked && (
                              <span>{level.wordCount} words</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default LevelSelect
