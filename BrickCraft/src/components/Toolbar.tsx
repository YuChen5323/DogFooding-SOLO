import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ToolType } from '../types/app';
import { BuildModeType } from '../types/buildMode';
import './Toolbar.css';

const TOOLS: { id: ToolType; icon: string; label: string; shortcut?: string }[] = [
  { id: 'select', icon: '👆', label: '选择', shortcut: 'V' },
  { id: 'place', icon: '🧱', label: '放置', shortcut: 'P' },
  { id: 'move', icon: '✋', label: '移动', shortcut: 'M' },
  { id: 'rotate', icon: '🔄', label: '旋转', shortcut: 'R' },
  { id: 'delete', icon: '🗑️', label: '删除', shortcut: 'Del' },
];

const BUILD_MODES: { id: BuildModeType; label: string; description: string }[] = [
  { id: 'precision', label: '精确模式', description: '网格吸附，碰撞检测' },
  { id: 'free', label: '自由模式', description: '自由放置，无吸附' },
];

export default function Toolbar() {
  const { state, setTool, setBuildMode, undo, redo, newProject, saveProject, exportProject, exportPDF, generateInstructions } = useAppContext();

  const handleExport = async (format: 'ldr' | 'gltf') => {
    await exportProject(format);
  };

  return (
    <div className="toolbar">
      {/* 项目操作 */}
      <div className="toolbar-section">
        <button
          className="toolbar-btn project-btn"
          onClick={newProject}
          title="新建项目"
        >
          <span className="toolbar-btn-icon">📄</span>
          <span className="toolbar-btn-label">新建</span>
        </button>
        <button
          className="toolbar-btn project-btn secondary"
          onClick={() => saveProject()}
          title="保存项目"
        >
          <span className="toolbar-btn-icon">💾</span>
          <span className="toolbar-btn-label">保存</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* 历史记录 */}
      <div className="toolbar-section">
        <button
          className="toolbar-btn history-btn"
          onClick={undo}
          disabled={!state.undoAvailable}
          title="撤销 (Ctrl+Z)"
        >
          ↩️
        </button>
        <button
          className="toolbar-btn history-btn"
          onClick={redo}
          disabled={!state.redoAvailable}
          title="重做 (Ctrl+Y)"
        >
          ↪️
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* 工具选择 */}
      <div className="toolbar-section">
        <span className="toolbar-section-title">工具</span>
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={`toolbar-btn ${state.tool === tool.id ? 'active' : ''} ${
              tool.id === 'delete' ? 'danger' : ''
            }`}
            onClick={() => setTool(tool.id)}
            title={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
          >
            <span className="toolbar-btn-icon">{tool.icon}</span>
            <span className="toolbar-btn-label">{tool.label}</span>
            {tool.shortcut && <span className="shortcut">{tool.shortcut}</span>}
          </button>
        ))}
      </div>

      <div className="toolbar-divider" />

      {/* 搭建模式 */}
      <div className="toolbar-section">
        <span className="toolbar-section-title">模式</span>
        <div className="mode-toggle">
          {BUILD_MODES.map((mode) => (
            <button
              key={mode.id}
              className={`mode-toggle-btn ${state.buildMode === mode.id ? 'active' : ''}`}
              onClick={() => setBuildMode(mode.id)}
              title={mode.description}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-divider" />

      {/* 导出操作 */}
      <div className="toolbar-section">
        <button
          className="toolbar-btn project-btn export"
          onClick={generateInstructions}
          title="生成拼装步骤"
        >
          <span className="toolbar-btn-icon">📋</span>
          <span className="toolbar-btn-label">步骤</span>
        </button>
        <button
          className="toolbar-btn project-btn export"
          onClick={exportPDF}
          title="导出PDF说明书"
        >
          <span className="toolbar-btn-icon">📄</span>
          <span className="toolbar-btn-label">PDF</span>
        </button>
        <button
          className="toolbar-btn project-btn export"
          onClick={() => handleExport('ldr')}
          title="导出LDR文件"
        >
          <span className="toolbar-btn-icon">📤</span>
          <span className="toolbar-btn-label">LDR</span>
        </button>
        <button
          className="toolbar-btn project-btn export"
          onClick={() => handleExport('gltf')}
          title="导出glTF文件"
        >
          <span className="toolbar-btn-icon">📤</span>
          <span className="toolbar-btn-label">glTF</span>
        </button>
      </div>

      {/* 统计信息 */}
      <div className="stats-display">
        <div className="stat-item">
          <span>零件数量:</span>
          <span className="stat-value">{state.parts.length}</span>
        </div>
        {state.selectedPartId && (
          <div className="stat-item">
            <span>选中零件:</span>
            <span className="stat-value">{state.selectedPartId}</span>
          </div>
        )}
      </div>

      {/* 加载指示器 */}
      {state.isLoading && (
        <div className="loading-indicator">
          <div className="loading-spinner" />
          <span className="loading-text">{state.loadingMessage || '加载中...'}</span>
        </div>
      )}
    </div>
  );
}
