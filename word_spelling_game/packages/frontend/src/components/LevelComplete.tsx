import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppSelector } from '@/store'

const LevelComplete = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { score, correctWords, wrongWords, combo, mode } = useAppSelector(
    (state) => state.game
  )

  const accuracy =
    correctWords + wrongWords > 0
      ? Math.round((correctWords / (correctWords + wrongWords)) * 100)
      : 0

  const calculateStars = () => {
    if (accuracy >= 90) return 3
    if (accuracy >= 70) return 2
    if (accuracy >= 50) return 1
    return 0
  }

  const stars = calculateStars()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 15,
      },
    },
  }

  const starVariants = (index: number) => ({
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        delay: index * 0.2,
        type: 'spring',
        damping: 12,
        stiffness: 200,
      },
    },
  })

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 overflow-y-auto">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-2">
            {t('levelComplete.title')}
          </h1>
        </motion.div>

        <motion.div variants={itemVariants} className="card mb-6">
          <div className="flex justify-center gap-4 mb-6">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                variants={starVariants(index)}
                className={`text-5xl ${index < stars ? 'text-yellow-400' : 'text-gray-600'}`}
              >
                ★
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-game-bg rounded-xl">
              <div className="text-sm text-gray-400 mb-1">
                {t('levelComplete.score')}
              </div>
              <div className="text-3xl font-bold text-primary-400">{score}</div>
            </div>

            <div className="text-center p-4 bg-game-bg rounded-xl">
              <div className="text-sm text-gray-400 mb-1">
                {t('levelComplete.accuracy')}
              </div>
              <div className="text-3xl font-bold text-green-400">{accuracy}%</div>
            </div>

            <div className="text-center p-4 bg-game-bg rounded-xl">
              <div className="text-sm text-gray-400 mb-1">
                {t('levelComplete.correctWords')}
              </div>
              <div className="text-2xl font-bold text-green-400">{correctWords}</div>
            </div>

            <div className="text-center p-4 bg-game-bg rounded-xl">
              <div className="text-sm text-gray-400 mb-1">
                {t('levelComplete.maxCombo')}
              </div>
              <div className="text-2xl font-bold text-orange-400">x{combo}</div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          <button
            onClick={() => navigate(`/levels/${mode}`)}
            className="game-button w-full text-center"
          >
            {t('levelComplete.nextLevel')}
          </button>

          <button
            onClick={() => window.history.back()}
            className="game-button-secondary w-full text-center"
          >
            {t('levelComplete.replay')}
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full py-3 text-gray-400 hover:text-white transition-colors text-center"
          >
            {t('levelComplete.backToMenu')}
          </button>
        </motion.div>
      </motion.div>

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 0.5],
              opacity: [0, 1, 0],
              y: [0, -100],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          >
            {['⭐', '✨', '🌟', '💫'][Math.floor(Math.random() * 4)]}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default LevelComplete
