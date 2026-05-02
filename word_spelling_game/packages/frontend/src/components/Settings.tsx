import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../store'
import { setLanguage, setSoundEffects, setMusicVolume, setTtsEnabled } from '../store/slices/settingsSlice'
import type { SoundVolume } from '../store/slices/settingsSlice'

function Settings() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { language, soundEffects, musicVolume, ttsEnabled } = useAppSelector((state) => state.settings)

  const languages = [
    { code: 'en' as const, label: 'English', flag: '🇺🇸' },
    { code: 'ja' as const, label: '日本語', flag: '🇯🇵' },
    { code: 'zh' as const, label: '中文', flag: '🇨🇳' },
  ]

  const volumeLevels: { value: SoundVolume; label: string }[] = [
    { value: 'off', label: 'Off' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ]

  const handleLanguageChange = (langCode: 'en' | 'ja' | 'zh') => {
    dispatch(setLanguage(langCode))
  }

  const handleSoundEffectsChange = (newValue: SoundVolume) => {
    dispatch(setSoundEffects(newValue))
  }

  const handleMusicVolumeChange = (newValue: SoundVolume) => {
    dispatch(setMusicVolume(newValue))
  }

  const handleToggleTts = () => {
    dispatch(setTtsEnabled(!ttsEnabled))
  }

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
          <h1 className="text-3xl font-bold mb-6 text-center">⚙️ Settings</h1>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-3 text-primary-400">🌐 Language</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`p-4 rounded-xl border transition-all ${
                      language === lang.code
                        ? 'bg-primary-600/30 border-primary-500'
                        : 'bg-game-bg border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="text-3xl mb-2">{lang.flag}</div>
                    <div className="font-medium">{lang.label}</div>
                    {language === lang.code && <div className="text-xs text-green-400 mt-1">✓ Selected</div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-700 pt-6">
              <h2 className="text-lg font-semibold mb-3 text-primary-400">🔊 Audio</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-game-bg rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium">Sound Effects</div>
                      <div className="text-sm text-gray-400">Game sound effects volume</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {volumeLevels.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => handleSoundEffectsChange(level.value)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          soundEffects === level.value
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-game-bg rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium">Music Volume</div>
                      <div className="text-sm text-gray-400">Background music volume</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {volumeLevels.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => handleMusicVolumeChange(level.value)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          musicVolume === level.value
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-game-bg rounded-xl">
                  <div>
                    <div className="font-medium">Text-to-Speech</div>
                    <div className="text-sm text-gray-400">Enable word pronunciation</div>
                  </div>
                  <button
                    onClick={handleToggleTts}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      ttsEnabled ? 'bg-primary-500' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                        ttsEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-6">
              <h2 className="text-lg font-semibold mb-3 text-primary-400">ℹ️ About</h2>
              <div className="p-4 bg-game-bg rounded-xl">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🎮</div>
                  <div className="font-bold text-lg">Word Spelling Game</div>
                  <div className="text-sm text-gray-400">v1.0.0</div>
                </div>
                <div className="text-sm text-gray-400 space-y-2">
                  <p>A fun and interactive way to learn spelling!</p>
                  <p>Features:</p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>3 game modes: Falling Letters, Puzzle, Speed Spell</li>
                    <li>Multi-language support: English, Japanese, Chinese</li>
                    <li>Offline support with Service Worker</li>
                    <li>Achievements and leaderboards</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105"
              >
                Back to Menu
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Settings
