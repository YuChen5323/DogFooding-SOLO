import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store'
import { register, clearError } from '../store/slices/userSlice'
import { useEffect } from 'react'

function Register() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.user)

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (formData.username.length < 2) {
      errors.username = 'Username must be at least 2 characters'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email'
    }

    if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    dispatch(
      register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      })
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: '',
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-game-card-bg rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎮</div>
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-400">Join the spelling adventure!</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500 text-red-400 rounded-lg p-3 mb-4 text-sm"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              className={`w-full px-4 py-3 bg-game-bg rounded-xl border ${
                validationErrors.username ? 'border-red-500' : 'border-gray-700'
              } focus:border-primary-500 focus:outline-none transition-colors`}
            />
            {validationErrors.username && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={`w-full px-4 py-3 bg-game-bg rounded-xl border ${
                validationErrors.email ? 'border-red-500' : 'border-gray-700'
              } focus:border-primary-500 focus:outline-none transition-colors`}
            />
            {validationErrors.email && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              className={`w-full px-4 py-3 bg-game-bg rounded-xl border ${
                validationErrors.password ? 'border-red-500' : 'border-gray-700'
              } focus:border-primary-500 focus:outline-none transition-colors`}
            />
            {validationErrors.password && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className={`w-full px-4 py-3 bg-game-bg rounded-xl border ${
                validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-700'
              } focus:border-primary-500 focus:outline-none transition-colors`}
            />
            {validationErrors.confirmPassword && (
              <p className="text-red-400 text-xs mt-1">{validationErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all transform hover:scale-105 mt-6"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300">
              Login here
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/"
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            ← Back to Menu
          </Link>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Register
