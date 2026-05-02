import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store'
import { startGame, resetGame } from '@/store/slices/gameSlice'
import { GameMode } from '@/store/slices/gameSlice'
import gameManager from '@/game'

const GameScreen = () => {
  const { t } = useTranslation()
  const { mode, levelId } = useParams<{ mode: string; levelId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const isInitialized = useRef(false)

  const { state: gameState, score, combo, lives, timeLeft, currentWord, typedLetters } =
    useAppSelector((state) => state.game)

  const wordList = (location.state as any)?.wordList || ['cat', 'dog', 'sun', 'pen', 'box']

  useEffect(() => {
    if (!isInitialized.current && mode && wordList.length > 0) {
      isInitialized.current = true
      
      dispatch(
        startGame({
          mode: mode as GameMode,
          levelId: levelId || 'quick',
          wordList: wordList,
        })
      )

      gameManager.initialize()
      gameManager.startGame(mode as GameMode, wordList)
    }

    return () => {
      gameManager.stopGame()
      dispatch(resetGame())
      isInitialized.current = false
    }
  }, [mode, levelId, wordList, dispatch])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderLives = () => {
    return Array.from({ length: 3 }).map((_, i) => (
      <span
        key={i}
        className={`text-2xl ${i < lives ? 'text-red-500' : 'text-gray-600'}`}
      >
        ❤
      </span>
    ))
  }

  const renderWordDisplay = () => {
    const letters = currentWord.split('')
    return (
      <div className="flex gap-2 justify-center">
        {letters.map((_letter, index) => (
          <div
            key={index}
            className={`w-12 h-14 md:w-16 md:h-18 rounded-lg flex items-center justify-center text-2xl md:text-3xl font-bold border-2 transition-all duration-300 ${
              index < typedLetters.length
                ? 'bg-green-500/20 border-green-500 text-green-400'
                : 'bg-game-card/50 border-primary-500/30 text-gray-400'
            }`}
          >
            {index < typedLetters.length
              ? typedLetters[index].toUpperCase()
              : '_'}
          </div>
        ))}
      </div>
    )
  }

  if (gameState === 'playing') {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="absolute top-0 left-0 right-0 z-50 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-game-card/80 backdrop-blur rounded-lg text-gray-300 hover:text-white transition-colors"
            >
              ← {t('common.back')}
            </button>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase tracking-wider">
                  {t('game.score')}
                </div>
                <div className="text-2xl font-bold text-primary-400">{score}</div>
              </div>

              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase tracking-wider">
                  {t('game.combo')}
                </div>
                <div
                  className={`text-2xl font-bold ${
                    combo > 0 ? 'text-orange-400' : 'text-gray-500'
                  }`}
                >
                  x{combo}
                </div>
              </div>

              {mode !== 'speed' && (
                <div className="flex items-center gap-1">{renderLives()}</div>
              )}

              {mode === 'speed' && (
                <div className="text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">
                    {t('game.time')}
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      timeLeft <= 10
                        ? 'text-red-400 animate-pulse'
                        : timeLeft <= 20
                        ? 'text-yellow-400'
                        : 'text-green-400'
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-50 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="card bg-game-card/80 backdrop-blur border-primary-500/20">
              {renderWordDisplay()}

              <div className="mt-4 text-center text-gray-400 text-sm">
                {t('game.word')}: <span className="text-primary-400 font-mono">{currentWord}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-32 left-0 right-0 z-50 flex justify-center md:hidden">
          <div className="grid grid-cols-9 gap-1 p-3 bg-game-card/90 backdrop-blur rounded-2xl">
            {'QWERTYUIOP'.split('').map((letter) => (
              <button
                key={letter}
                className="w-8 h-10 bg-primary-600/30 rounded-lg text-white font-bold text-sm active:bg-primary-500/50"
              >
                {letter}
              </button>
            ))}
            {'ASDFGHJKL'.split('').map((letter) => (
              <button
                key={letter}
                className="w-8 h-10 bg-primary-600/30 rounded-lg text-white font-bold text-sm active:bg-primary-500/50"
              >
                {letter}
              </button>
            ))}
            {'ZXCVBNM'.split('').map((letter) => (
              <button
                key={letter}
                className="w-8 h-10 bg-primary-600/30 rounded-lg text-white font-bold text-sm active:bg-primary-500/50"
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-xl text-gray-400">{t('common.loading')}</p>
      </div>
    </div>
  )
}

export default GameScreen
