import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '@/store'
import { login } from '@/store/slices/userSlice'

const Login = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((state) => state.user)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await dispatch(login({ email, password }))
    if (login.fulfilled.match(result)) {
      navigate('/')
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-game-accent">
              {t('menu.title')}
            </h1>
          </Link>
          <h2 className="text-2xl font-bold text-white mt-6">
            {t('auth.loginTitle')}
          </h2>
        </motion.div>

        <motion.div variants={itemVariants} className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-400 hover:text-primary-300"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="game-button w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                  {t('common.loading')}
                </span>
              ) : (
                t('common.login')
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {t('auth.noAccount')}{' '}
              <Link
                to="/register"
                className="text-primary-400 hover:text-primary-300 font-medium"
              >
                {t('common.register')}
              </Link>
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-6 text-center">
          <Link
            to="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← {t('common.back')}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Login
