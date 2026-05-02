import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../store'
import { resetGame } from '../store/slices/gameSlice'

function GameOver() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { score, correctWords } = useAppSelector((state) => state.game)

  const handleRetry = () => {
    dispatch(resetGame())
    navigate(-1)
  }

  const handleBackToMenu = () => {
    dispatch(resetGame())
    navigate('/')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="bg-game-card-bg rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
      >
        <div className="text-6xl mb-4">😔</div>
        <h1 className="text-3xl font-bold mb-2 text-red-400">Game Over</h1>
        <p className="text-gray-300 mb-6">Don't worry, you'll do better next time!</p>

        <div className="bg-game-bg rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{score}</div>
              <div className="text-sm text-gray-400">Final Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{correctWords}</div>
              <div className="text-sm text-gray-400">Words Completed</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105"
          >
            Try Again
          </button>
          <button
            onClick={handleBackToMenu}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all transform hover:scale-105"
          >
            Back to Menu
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default GameOver
