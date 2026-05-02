import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../store'
import { logout } from '../store/slices/userSlice'

function Profile() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user: userData, isAuthenticated } = useAppSelector((state) => state.user)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-400">Please login to view your profile</p>
      </div>
    )
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
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-3xl font-bold">
              {userData?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{userData?.username || 'Player'}</h1>
              <p className="text-gray-400">{userData?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-game-bg rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">Lv.{userData?.level || 1}</div>
              <div className="text-sm text-gray-400">Level</div>
            </div>
            <div className="bg-game-bg rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{userData?.experience || 0}</div>
              <div className="text-sm text-gray-400">EXP</div>
            </div>
            <div className="bg-game-bg rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{userData?.coins || 0}</div>
              <div className="text-sm text-gray-400">Coins</div>
            </div>
            <div className="bg-game-bg rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">
                {userData?.totalWordsLearned || 0}
              </div>
              <div className="text-sm text-gray-400">Words</div>
            </div>
          </div>

          {userData?.streak && userData.streak > 0 && (
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4 mb-6 border border-orange-500/30">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="font-bold text-orange-400">{userData.streak} Day Streak!</div>
                  <div className="text-sm text-gray-400">Keep it up!</div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => navigate('/settings')}
              className="w-full py-3 bg-game-bg hover:bg-gray-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              ⚙️ Settings
            </button>
            <button
              onClick={() => navigate('/achievements')}
              className="w-full py-3 bg-game-bg hover:bg-gray-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              🏆 Achievements
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              className="w-full py-3 bg-game-bg hover:bg-gray-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              📊 Leaderboard
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
            >
              🚪 Logout
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Profile
