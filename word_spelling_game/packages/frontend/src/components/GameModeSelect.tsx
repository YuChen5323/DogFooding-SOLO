import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GameMode } from '@/store/slices/gameSlice'

interface GameModeCard {
  mode: GameMode
  icon: string
  gradient: string
  borderColor: string
}

const GameModeSelect = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const gameModes: GameModeCard[] = [
    {
      mode: 'falling',
      icon: '🍂',
      gradient: 'from-blue-500 to-indigo-600',
      borderColor: 'border-blue-400',
    },
    {
      mode: 'puzzle',
      icon: '🧩',
      gradient: 'from-purple-500 to-pink-600',
      borderColor: 'border-purple-400',
    },
    {
      mode: 'speed',
      icon: '⚡',
      gradient: 'from-orange-500 to-red-600',
      borderColor: 'border-orange-400',
    },
  ]

  const handleModeSelect = (mode: GameMode) => {
    navigate(`/levels/${mode}`)
  }

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
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 15,
      },
    },
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 overflow-y-auto">
      <motion.div
        className="w-full max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-game-accent mb-4">
            {t('menu.gameModes')}
          </h1>
          <p className="text-xl text-gray-400">
            Choose your preferred way to learn
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {gameModes.map((mode, index) => (
            <motion.div
              key={mode.mode}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleModeSelect(mode.mode)}
              className={`cursor-pointer card border-2 ${mode.borderColor} hover:border-white/50 transition-all duration-300`}
            >
              <div className="text-center">
                <motion.div
                  className={`w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center text-5xl shadow-lg`}
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.2,
                  }}
                >
                  {mode.icon}
                </motion.div>

                <h3 className="text-2xl font-bold mb-3">
                  {t(`gameModes.${mode.mode}.name`)}
                </h3>

                <p className="text-gray-400 text-sm leading-relaxed">
                  {t(`gameModes.${mode.mode}.description`)}
                </p>

                <div className="mt-6">
                  <span className="inline-block px-4 py-2 bg-gradient-to-r from-primary-500/20 to-primary-600/20 rounded-full text-primary-400 text-sm font-medium border border-primary-500/30">
                    {t('common.play')} →
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={itemVariants}
          className="mt-12 text-center"
        >
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← {t('common.back')}
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default GameModeSelect
