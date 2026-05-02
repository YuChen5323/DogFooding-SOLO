import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../store'
import { hideAchievementModal } from '../store/slices/achievementSlice'

interface AchievementModalProps {
  achievement: {
    id: string
    name: Record<string, string>
    description: Record<string, string>
    icon: string
  }
}

function AchievementModal({ achievement }: AchievementModalProps) {
  const dispatch = useAppDispatch()
  const { language } = useAppSelector((state) => state.settings)

  const handleClose = useCallback(() => {
    dispatch(hideAchievementModal())
  }, [dispatch])

  useEffect(() => {
    const timer = setTimeout(handleClose, 5000)
    return () => clearTimeout(timer)
  }, [handleClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.5, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.5, y: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          className="bg-gradient-to-br from-game-card-bg to-game-bg rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-primary-500/30"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', damping: 10 }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-5xl shadow-lg">
                {achievement.icon}
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold shadow-lg"
              >
                ✓
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-2xl font-bold text-yellow-400 mb-2"
            >
              🎉 Achievement Unlocked!
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-2">
              {achievement.name[language as keyof typeof achievement.name] || achievement.name.en}
            </h2>
            <p className="text-gray-400">
              {achievement.description[language as keyof typeof achievement.description] ||
                achievement.description.en}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6"
          >
            <button
              onClick={handleClose}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105"
            >
              Awesome!
            </button>
          </motion.div>

          <motion.div
            className="mt-4 h-1 bg-game-bg rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AchievementModal
