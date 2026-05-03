import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from '@/store'
import Navigation from '@/components/Navigation/Navigation'
import JosekiLibrary from '@/pages/JosekiLibrary/JosekiLibrary'
import FreePlay from '@/pages/FreePlay/FreePlay'
import JosekiTraining from '@/pages/JosekiTraining/JosekiTraining'
import ReviewMode from '@/pages/ReviewMode/ReviewMode'
import './App.css'

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <div className="app">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<JosekiLibrary />} />
              <Route path="/play" element={<FreePlay />} />
              <Route path="/training" element={<JosekiTraining />} />
              <Route path="/review" element={<ReviewMode />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Provider>
  )
}

export default App
