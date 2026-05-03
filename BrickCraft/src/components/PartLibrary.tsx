import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { LDrawColors, getLDrawColor } from '../utils/ldrawColors';
import { PartLibraryItem } from '../types/app';
import './PartLibrary.css';

// 常用颜色列表
const COMMON_COLORS = [
  14, // Yellow (乐高黄)
  15, // White
  1,  // Blue
  2,  // Green
  4,  // Red
  24, // Orange
  26, // Lime
  71, // Light Bluish Gray
  72, // Dark Bluish Gray
  0,  // Black
  70, // Reddish Brown
  22, // Purple
  10, // Bright Green
  28, // Earth Orange
  37, // Trans-Clear
  31, // Trans-Black
  32, // Trans-Dark Blue
  33, // Trans-Green
  34, // Trans-Red
  36, // Trans-Yellow
];

interface PartCardProps {
  part: PartLibraryItem;
  selectedColor: number;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent, part: PartLibraryItem) => void;
}

function PartCard({ part, selectedColor, isSelected, onSelect, onDragStart }: PartCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const color = getLDrawColor(selectedColor);

  // 简单的Canvas预览
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    // 绘制简单的砖块预览
    const brickWidth = 60;
    const brickHeight = 24;
    const x = (rect.width - brickWidth) / 2;
    const y = (rect.height - brickHeight) / 2;

    // 顶面
    ctx.fillStyle = color.hex;
    ctx.fillRect(x + 2, y, brickWidth - 4, brickHeight - 4);
    
    // 3D效果 - 右边和下边
    ctx.fillStyle = shadeColor(color.hex, -20);
    ctx.fillRect(x + brickWidth - 4, y, 4, brickHeight - 4);
    ctx.fillRect(x, y + brickHeight - 4, brickWidth, 4);
    
    // 高光 - 左边和上边
    ctx.fillStyle = shadeColor(color.hex, 20);
    ctx.fillRect(x, y, 2, brickHeight - 4);
    ctx.fillRect(x, y, brickWidth - 2, 2);

    // 凸点
    const studSize = 10;
    const studCount = part.partId === '3003' || part.partId === '3022' ? 4 : 8;
    const studsPerRow = part.partId === '3003' || part.partId === '3022' ? 2 : 4;
    
    for (let i = 0; i < studCount; i++) {
      const row = Math.floor(i / studsPerRow);
      const col = i % studsPerRow;
      const studX = x + 8 + col * 14;
      const studY = y + 4 + row * 14;
      
      // 凸点底部阴影
      ctx.fillStyle = shadeColor(color.hex, -10);
      ctx.beginPath();
      ctx.arc(studX + 1, studY + 1, studSize / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // 凸点主体
      ctx.fillStyle = color.hex;
      ctx.beginPath();
      ctx.arc(studX, studY, studSize / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // 凸点高光
      ctx.fillStyle = shadeColor(color.hex, 30);
      ctx.beginPath();
      ctx.arc(studX - 1, studY - 1, studSize / 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [color, part.partId]);

  function shadeColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  }

  return (
    <div
      className={`part-card ${isSelected ? 'selected' : ''}`}
      draggable
      onClick={onSelect}
      onDragStart={(e) => onDragStart(e, part)}
    >
      <div className="part-card-preview">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="part-card-info">
        <span className="part-card-name">{part.name}</span>
        <span className="part-card-id">{part.partId}</span>
        <span className="part-card-category">{part.category}</span>
      </div>
    </div>
  );
}

export default function PartLibrary() {
  const { state, getFilteredParts, setSearchQuery, setColorFilter, startPlacement, setSelectedColor, setSelectedPartId } = useAppContext();
  const [localSearch, setLocalSearch] = useState('');
  const filteredParts = getFilteredParts();

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setLocalSearch(query);
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleColorSelect = useCallback((colorCode: number | null) => {
    setColorFilter(colorCode);
    if (colorCode !== null) {
      setSelectedColor(colorCode);
    }
  }, [setColorFilter, setSelectedColor]);

  const handlePartSelect = useCallback((part: PartLibraryItem) => {
    setSelectedPartId(part.partId);
    startPlacement(part.partId, state.selectedColor);
  }, [state.selectedColor, setSelectedPartId, startPlacement]);

  const handleDragStart = useCallback((e: React.DragEvent, part: PartLibraryItem) => {
    e.dataTransfer.setData('partId', part.partId);
    e.dataTransfer.setData('color', state.selectedColor.toString());
    e.dataTransfer.effectAllowed = 'copy';
  }, [state.selectedColor]);

  const selectedColor = getLDrawColor(state.selectedColor);

  return (
    <div className="part-library">
      <div className="part-library-header">
        <h3 className="part-library-title">零件库</h3>
        
        <div className="part-search">
          <input
            type="text"
            placeholder="搜索零件ID或名称..."
            value={localSearch}
            onChange={handleSearchChange}
          />
        </div>

        <div className="selected-color-display">
          <div
            className={`selected-color-swatch ${selectedColor.isTransparent ? 'transparent' : ''}`}
            style={{ backgroundColor: selectedColor.hex }}
          />
          <span className="selected-color-name">{selectedColor.name}</span>
        </div>

        <div className="color-filter">
          <span className="color-filter-label">颜色过滤</span>
          <div className="color-palette">
            <div
              className={`color-swatch ${state.colorFilter === null ? 'selected' : ''} transparent`}
              onClick={() => handleColorSelect(null)}
              title="全部颜色"
              style={{
                background: 'repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 8px 8px'
              }}
            />
            {COMMON_COLORS.map((colorCode) => {
              const color = LDrawColors[colorCode];
              if (!color) return null;
              return (
                <div
                  key={colorCode}
                  className={`color-swatch ${
                    state.colorFilter === colorCode ? 'selected' : ''
                  } ${color.isTransparent ? 'transparent' : ''}`}
                  onClick={() => handleColorSelect(colorCode)}
                  title={color.name}
                  style={{ backgroundColor: color.hex }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="part-library-content">
        {filteredParts.length > 0 ? (
          <div className="part-grid">
            {filteredParts.map((part) => (
              <PartCard
                key={part.partId}
                part={part}
                selectedColor={state.selectedColor}
                isSelected={state.selectedPartId === part.partId}
                onSelect={() => handlePartSelect(part)}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        ) : (
          <div className="no-results">
            <span className="no-results-icon">🔍</span>
            <span className="no-results-text">未找到匹配的零件</span>
          </div>
        )}
      </div>
    </div>
  );
}
