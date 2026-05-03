import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Navigation.css'

const Navigation: React.FC = () => {
  const location = useLocation()

  const navItems = [
    { path: '/', label: '定式库', icon: '📖' },
    { path: '/play', label: '自由对弈', icon: '⚔️' },
    { path: '/training', label: '定式训练', icon: '🎯' },
    { path: '/review', label: '复盘分析', icon: '📊' },
  ]

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="logo">
          <span className="logo-icon">围棋</span>
          <span className="logo-text">定式训练</span>
        </Link>

        <div className="nav-links">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="nav-actions">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="nav-action">
            <span className="action-icon">📂</span>
            <span className="action-label">源码</span>
          </a>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
