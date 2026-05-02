import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../store'

type GameMode = 'all' | 'falling' | 'puzzle' | 'speed'
type LeaderboardPeriod = 'all_time' | 'daily' | 'weekly'
type LeaderboardType = 'global' | 'friends'

interface LeaderboardEntry {
  rank: number
  username: string
  avatar?: string
  score: number
  date: string
}

function Leaderboard() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAppSelector((state) => state.user)

  const [mode, setMode] = useState<GameMode>('all')
  const [period, setPeriod] = useState<LeaderboardPeriod>('all_time')
  const [type, setType] = useState<LeaderboardType>('global')
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<{ rank: number; entry: LeaderboardEntry } | null>(null)

  const mockEntries: LeaderboardEntry[] = [
    { rank: 1, username: 'SpellingMaster', avatar: undefined, score: 99999, date: '2024-01-15' },
    { rank: 2, username: 'WordWizard', avatar: undefined, score: 87654, date: '2024-01-14' },
    { rank: 3, username: 'LexiconKing', avatar: undefined, score: 76543, date: '2024-01-13' },
    { rank: 4, username: 'SpellBound', avatar: undefined, score: 65432, date: '2024-01-12' },
    { rank: 5, username: 'WordSmith', avatar: undefined, score: 54321, date: '2024-01-11' },
    { rank: 6, username: 'AlphaGamer', avatar: undefined, score: 43210, date: '2024-01-10' },
    { rank: 7, username: 'SpellingBee', avatar: undefined, score: 32109, date: '2024-01-09' },
    { rank: 8, username: 'Dictionary', avatar: undefined, score: 21098, date: '2024-01-08' },
    { rank: 9, username: 'Thesaurus', avatar: undefined, score: 10987, date: '2024-01-07' },
    { rank: 10, username: 'GrammarNazi', avatar: undefined, score: 9876, date: '2024-01-06' },
  ]

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setEntries(mockEntries)
      if (isAuthenticated) {
        setUserRank({
          rank: 42,
          entry: {
            rank: 42,
            username: 'You',
            score: 1234,
            date: '2024-01-15',
          },
        })
      }
      setLoading(false)
    }, 500)
  }, [mode, period, type, isAuthenticated])

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/20 border-yellow-500/50'
      case 2:
        return 'bg-gray-400/20 border-gray-400/50'
      case 3:
        return 'bg-orange-600/20 border-orange-600/50'
      default:
        return 'bg-game-bg border-gray-700/50'
    }
  }

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return `#${rank}`
    }
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
          <h1 className="text-3xl font-bold mb-6 text-center">🏆 Leaderboard</h1>

          <div className="space-y-4 mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(['all', 'falling', 'puzzle', 'speed'] as GameMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    mode === m
                      ? 'bg-primary-600 text-white'
                      : 'bg-game-bg text-gray-400 hover:text-white'
                  }`}
                >
                  {m === 'all' ? 'All' : m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {(['all_time', 'daily', 'weekly'] as LeaderboardPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    period === p
                      ? 'bg-primary-600 text-white'
                      : 'bg-game-bg text-gray-400 hover:text-white'
                  }`}
                >
                  {p === 'all_time' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            {isAuthenticated && (
              <div className="flex gap-2">
                {(['global', 'friends'] as LeaderboardType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                      type === t
                        ? 'bg-primary-600 text-white'
                        : 'bg-game-bg text-gray-400 hover:text-white'
                    }`}
                  >
                    {t === 'global' ? '🌍 Global' : '👥 Friends'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.rank}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-4 p-3 rounded-xl border ${getRankColor(
                    entry.rank
                  )}`}
                >
                  <div
                    className={`w-10 h-10 flex items-center justify-center font-bold ${
                      entry.rank <= 3 ? 'text-xl' : 'text-gray-400'
                    }`}
                  >
                    {getRankEmoji(entry.rank)}
                  </div>

                  <div className="flex-1">
                    <div className="font-semibold">{entry.username}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(entry.date).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-yellow-400">{entry.score.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </motion.div>
              ))}

              {userRank && !entries.find((e) => e.rank === userRank!.rank) && (
                <div className="mt-4">
                  <div className="text-center text-gray-500 text-sm mb-2">... more entries ...</div>
                  <div className="flex items-center gap-4 p-3 rounded-xl border border-primary-500/50 bg-primary-500/10">
                    <div className="w-10 h-10 flex items-center justify-center font-bold text-primary-400">
                      #{userRank.rank}
                    </div>

                    <div className="flex-1">
                      <div className="font-semibold text-primary-400">You</div>
                      <div className="text-xs text-gray-500">Your current position</div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-yellow-400">
                        {userRank.entry.score.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isAuthenticated && (
            <div className="mt-6 p-4 bg-game-bg rounded-xl text-center">
              <p className="text-gray-400 mb-3">Login to track your progress on the leaderboard!</p>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors"
              >
                Login
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Leaderboard
