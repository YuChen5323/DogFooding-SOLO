import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from './store'
import { fetchCurrentUser } from './store/slices/userSlice'
import i18n from './i18n'
import MainMenu from './components/MainMenu'
import GameModeSelect from './components/GameModeSelect'
import LevelSelect from './components/LevelSelect'
import GameScreen from './components/GameScreen'
import LevelComplete from './components/LevelComplete'
import GameOver from './components/GameOver'
import Login from './components/Login'
import Register from './components/Register'
import Profile from './components/Profile'
import Leaderboard from './components/Leaderboard'
import Achievements from './components/Achievements'
import Settings from './components/Settings'
import AchievementModal from './components/AchievementModal'

function App() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, token } = useAppSelector((state) => state.user)
  const { language } = useAppSelector((state) => state.settings)
  const { showAchievementModal, latestAchievement } = useAppSelector((state) => state.achievement)

  useEffect(() => {
    if (token) {
      dispatch(fetchCurrentUser())
    }
  }, [token, dispatch])

  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language])

  return (
    <BrowserRouter>
      <div className="w-full h-full bg-game-bg text-white overflow-hidden">
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/game-modes" element={<GameModeSelect />} />
          <Route path="/levels/:mode" element={<LevelSelect />} />
          <Route path="/game/:mode/:levelId" element={<GameScreen />} />
          <Route path="/level-complete" element={<LevelComplete />} />
          <Route path="/game-over" element={<GameOver />} />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
          />
          <Route
            path="/profile"
            element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />}
          />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>

        {showAchievementModal && latestAchievement && (
          <AchievementModal achievement={latestAchievement} />
        )}
      </div>
    </BrowserRouter>
  )
}

export default App
