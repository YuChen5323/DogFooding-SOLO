import type React from 'react';
import type { KeyboardKey as KeyboardKeyType } from '../types';
import { useKeyboardStore } from '../store';
import './KeyboardKey.css';

interface KeyboardKeyProps {
  keyData: KeyboardKeyType;
  isSelected?: boolean;
  onSelect?: (key: KeyboardKeyType) => void;
  onDragStart?: (e: React.DragEvent, key: KeyboardKeyType) => void;
  draggable?: boolean;
}

export const KeyboardKeyComponent: React.FC<KeyboardKeyProps> = ({
  keyData,
  isSelected = false,
  onSelect,
  onDragStart,
  draggable = false,
}) => {
  const { currentKey } = useKeyboardStore();
  
  const handleClick = () => {
    if (onSelect) {
      onSelect(keyData);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart && draggable) {
      onDragStart(e, keyData);
    }
  };

  const isCurrentlySelected = isSelected || (currentKey?.id === keyData.id);

  return (
    <div
      className={`keycap-key ${isCurrentlySelected ? 'selected' : ''} ${draggable ? 'draggable' : ''}`}
      style={{
        width: `${keyData.size.width}px`,
        height: `${keyData.size.height}px`,
        left: `${keyData.position.x}px`,
        top: `${keyData.position.y}px`,
        backgroundColor: keyData.style.color,
        color: keyData.style.textColor,
        borderRadius: '4px',
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: isCurrentlySelected 
          ? '0 0 0 2px #1890ff, 0 4px 8px rgba(0,0,0,0.3)' 
          : '0 2px 4px rgba(0,0,0,0.2)',
        transition: 'all 0.2s ease',
        border: isCurrentlySelected ? '2px solid #1890ff' : '1px solid #4a4a4a',
        fontSize: `${keyData.style.fontSize}px`,
        fontFamily: keyData.style.fontFamily,
        userSelect: 'none',
      }}
      onClick={handleClick}
      draggable={draggable}
      onDragStart={handleDragStart}
    >
      <span className="key-label">{keyData.label}</span>
      
      {keyData.style.profile && (
        <div 
          className="key-profile-indicator"
          style={{
            position: 'absolute',
            bottom: '2px',
            right: '4px',
            fontSize: '8px',
            opacity: 0.5,
          }}
        >
          {keyData.style.profile}
        </div>
      )}
    </div>
  );
};

export default KeyboardKeyComponent;
