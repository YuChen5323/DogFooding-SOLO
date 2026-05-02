import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppSelector } from '@/store'

const MainMenu = () => {
  const { t } = useTranslation()
  const { user, isAuthenticated } = useAppSelector((state) => state.user)

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
      transition: {
        type: 'spring',
        damping: 12,
      },
    },
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-game-accent mb-4 text-glow">
            {t('menu.title')}
          </h1>
          <p className="text-xl text-gray-400">{t('menu.subtitle')}</p>
        </motion.div>

        {isAuthenticated && user && (
          <motion.div
            variants={itemVariants}
            className="card mb-6 flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-2xl font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">{user.username}</p>
              <p className="text-sm text-gray-400">
                {t('profile.level')}: {user.level} | {t('profile.experience')}: {user.experience}
              </p>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          <motion.div variants={itemVariants}>
            <Link to="/game-modes" className="block">
              <button className="game-button w-full text-center">
                {t('menu.quickPlay')}
              </button>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link to="/leaderboard" className="block">
              <button className="game-button-secondary w-full text-center">
                {t('common.leaderboard')}
              </button>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link to="/achievements" className="block">
              <button className="game-button-secondary w-full text-center">
                {t('common.achievements')}
              </button>
            </Link>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="flex gap-4">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="flex-1">
                    <button className="game-button-secondary w-full text-center py-3">
                      {t('common.profile')}
                    </button>
                  </Link>
                  <Link to="/settings" className="flex-1">
                    <button className="game-button-secondary w-full text-center py-3">
                      {t('common.settings')}
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex-1">
                    <button className="game-button-secondary w-full text-center py-3">
                      {t('common.login')}
                    </button>
                  </Link>
                  <Link to="/register" className="flex-1">
                    <button className="game-button w-full text-center py-3">
                      {t('common.register')}
                    </button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          variants={itemVariants}
          className="mt-8 text-center text-gray-500 text-sm"
        >
          <p>v1.0.0</p>
        </motion.div>
      </motion.div>

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary-500/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default MainMenu
