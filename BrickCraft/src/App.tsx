import React from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext';
import Toolbar from './components/Toolbar';
import PartLibrary from './components/PartLibrary';
import InteractiveScene from './components/InteractiveScene';
import './App.css';

// 主应用内容
function AppContent() {
  const { state } = useAppContext();

  return (
    <div className="app">
      {/* 头部 */}
      <header className="app-header">
        <h1>BrickCraft</h1>
        <div className="header-right">
          <span>
            {state.buildMode === 'precision' ? '⚙️ 精确模式' : '🎨 自由模式'}
          </span>
          <span>
            零件: {state.parts.length}
          </span>
        </div>
      </header>

      {/* 工具栏 */}
      <div className="toolbar-wrapper">
        <Toolbar />
      </div>

      {/* 主布局 */}
      <div className="app-layout">
        {/* 左侧零件库 */}
        <aside className="part-library-panel">
          <PartLibrary />
        </aside>

        {/* 中间3D场景 */}
        <main className="scene-panel">
          <InteractiveScene />
        </main>
      </div>

      {/* 底部状态栏 */}
      <footer className="app-footer">
        <div className="footer-left">
          <div className="footer-status">
            <span className="status-dot" />
            <span>就绪</span>
          </div>
          {state.selectedPartId && (
            <span>选中: {state.selectedPartId}</span>
          )}
        </div>
        <div className="footer-center">
          <span>
            基于 React Three Fiber + TypeScript + Rapier.js 构建
          </span>
        </div>
        <div className="footer-right">
          <span>
            {state.undoAvailable ? '↩️ 可撤销' : ''}
          </span>
          <span>
            {state.redoAvailable ? '↪️ 可重做' : ''}
          </span>
        </div>
      </footer>
    </div>
  );
}

// 主应用组件，包裹在AppProvider中
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App
