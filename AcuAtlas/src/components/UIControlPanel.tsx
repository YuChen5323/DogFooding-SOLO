import { useState } from 'react';
import { MeridianType } from '../types';
import { useUIVisualizationStore } from '../stores/uiVisualizationStore';
import { useAcupointStore } from '../stores/acupointStore';
import { MERIDIANS } from '../data/acupointData';

// 解剖视角选项
const ANATOMICAL_VIEWS = [
  { id: 'front' as const, label: '正面', icon: '👤' },
  { id: 'back' as const, label: '背面', icon: '👤' },
  { id: 'left' as const, label: '左侧', icon: '👤' },
  { id: 'right' as const, label: '右侧', icon: '👤' },
  { id: 'top' as const, label: '头顶', icon: '⬆️' },
  { id: 'perspective' as const, label: '透视', icon: '🔍' }
];

// 预设视图选项
const PRESET_VIEWS = [
  { id: 'full' as const, label: '完整', description: '显示皮肤层' },
  { id: 'muscular' as const, label: '肌肉', description: '显示肌肉层' },
  { id: 'skeletal' as const, label: '骨骼', description: '显示骨骼层' },
  { id: 'transparent' as const, label: '透明', description: '半透明所有层' }
];

export function UIControlPanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const {
    showSkin,
    showMuscles,
    showBones,
    showMeridians,
    showAcupoints,
    skinOpacity,
    muscleOpacity,
    boneOpacity,
    selectedMeridian,
    anatomicalView,
    toggleSkin,
    toggleMuscles,
    toggleBones,
    toggleMeridians,
    toggleAcupoints,
    setSkinOpacity,
    setMuscleOpacity,
    setBoneOpacity,
    setSelectedMeridian,
    setAnatomicalView,
    setFullView,
    setMuscularView,
    setSkeletalView,
    setTransparentView
  } = useUIVisualizationStore();
  
  const { isInsertionMode, setIsInsertionMode } = useAcupointStore();
  
  // 处理预设视图切换
  const handlePresetView = (preset: string) => {
    switch (preset) {
      case 'full':
        setFullView();
        break;
      case 'muscular':
        setMuscularView();
        break;
      case 'skeletal':
        setSkeletalView();
        break;
      case 'transparent':
        setTransparentView();
        break;
    }
  };
  
  return (
    <div 
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        width: '280px',
        zIndex: 50
      }}
    >
      {/* 折叠/展开按钮 */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(248, 245, 240, 0.95)',
          border: '1px solid #e8e0d5',
          borderRadius: '12px 12px 0 0',
          padding: '12px 16px',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🎋</span>
          <span style={{ fontWeight: '600', color: '#4a4845', fontSize: '16px' }}>
            AcuAtlas 控制面板
          </span>
        </div>
        <span style={{ 
          color: '#8b8680', 
          transition: 'transform 0.3s ease',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </span>
      </div>
      
      {/* 控制面板内容 */}
      {isExpanded && (
        <div 
          style={{
            background: 'rgba(248, 245, 240, 0.95)',
            border: '1px solid #e8e0d5',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            padding: '16px',
            maxHeight: '70vh',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}
        >
          {/* 练习模式按钮 */}
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={() => setIsInsertionMode(!isInsertionMode)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isInsertionMode 
                  ? 'linear-gradient(135deg, #E74C3C, #C0392B)' 
                  : 'linear-gradient(135deg, #F39C12, #E67E22)',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: isInsertionMode 
                  ? '0 2px 8px rgba(231, 76, 60, 0.4)' 
                  : '0 2px 8px rgba(243, 156, 18, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              {isInsertionMode ? '🔴 退出针刺练习' : '🪡 开始针刺练习'}
            </button>
          </div>
          
          {/* 解剖视角 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              fontWeight: '600', 
              color: '#4a4845', 
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              📐 解剖视角
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '6px' 
            }}>
              {ANATOMICAL_VIEWS.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setAnatomicalView(view.id)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '6px',
                    border: anatomicalView === view.id 
                      ? '2px solid #D4AF37' 
                      : '1px solid #e8e0d5',
                    background: anatomicalView === view.id 
                      ? 'rgba(212, 175, 55, 0.2)' 
                      : 'rgba(240, 230, 214, 0.5)',
                    color: '#4a4845',
                    fontSize: '11px',
                    fontWeight: anatomicalView === view.id ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* 预设视图 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              fontWeight: '600', 
              color: '#4a4845', 
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              👁️ 显示模式
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '8px' 
            }}>
              {PRESET_VIEWS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetView(preset.id)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '8px',
                    border: '1px solid #e8e0d5',
                    background: 'rgba(240, 230, 214, 0.5)',
                    color: '#4a4845',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                    {preset.label}
                  </div>
                  <div style={{ fontSize: '10px', color: '#8b8680' }}>
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* 图层开关 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              fontWeight: '600', 
              color: '#4a4845', 
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              🧩 图层控制
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* 皮肤层 */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '8px',
                  background: 'rgba(250, 214, 165, 0.1)',
                  borderRadius: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#FAD6A5',
                    border: '2px solid #e8e0d5'
                  }} />
                  <span style={{ fontSize: '13px', color: '#4a4845' }}>皮肤</span>
                </div>
                <button
                  onClick={toggleSkin}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: showSkin ? '#27AE60' : '#bdc3c7',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: showSkin ? '22px' : '2px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                    transition: 'left 0.2s ease'
                  }} />
                </button>
              </div>
              
              {/* 肌肉层 */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '8px',
                  background: 'rgba(231, 76, 60, 0.1)',
                  borderRadius: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#E74C3C',
                    border: '2px solid #e8e0d5'
                  }} />
                  <span style={{ fontSize: '13px', color: '#4a4845' }}>肌肉</span>
                </div>
                <button
                  onClick={toggleMuscles}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: showMuscles ? '#27AE60' : '#bdc3c7',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: showMuscles ? '22px' : '2px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                    transition: 'left 0.2s ease'
                  }} />
                </button>
              </div>
              
              {/* 骨骼层 */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '8px',
                  background: 'rgba(236, 240, 241, 0.3)',
                  borderRadius: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#ECF0F1',
                    border: '2px solid #bdc3c7'
                  }} />
                  <span style={{ fontSize: '13px', color: '#4a4845' }}>骨骼</span>
                </div>
                <button
                  onClick={toggleBones}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: showBones ? '#27AE60' : '#bdc3c7',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: showBones ? '22px' : '2px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                    transition: 'left 0.2s ease'
                  }} />
                </button>
              </div>
              
              {/* 经络 */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '8px',
                  background: 'rgba(52, 152, 219, 0.1)',
                  borderRadius: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3498DB, #2980B9)',
                    border: '2px solid #e8e0d5'
                  }} />
                  <span style={{ fontSize: '13px', color: '#4a4845' }}>经络</span>
                </div>
                <button
                  onClick={toggleMeridians}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: showMeridians ? '#27AE60' : '#bdc3c7',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: showMeridians ? '22px' : '2px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                    transition: 'left 0.2s ease'
                  }} />
                </button>
              </div>
              
              {/* 穴位 */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '8px',
                  background: 'rgba(231, 76, 60, 0.1)',
                  borderRadius: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#E74C3C',
                    border: '2px solid #D4AF37'
                  }} />
                  <span style={{ fontSize: '13px', color: '#4a4845' }}>穴位</span>
                </div>
                <button
                  onClick={toggleAcupoints}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: showAcupoints ? '#27AE60' : '#bdc3c7',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: showAcupoints ? '22px' : '2px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                    transition: 'left 0.2s ease'
                  }} />
                </button>
              </div>
            </div>
          </div>
          
          {/* 经络选择 */}
          {showMeridians && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                fontWeight: '600', 
                color: '#4a4845', 
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                🧭 经络选择
              </div>
              <select
                value={selectedMeridian || ''}
                onChange={(e) => setSelectedMeridian(
                  e.target.value ? (e.target.value as MeridianType) : undefined
                )}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e8e0d5',
                  background: 'rgba(240, 230, 214, 0.5)',
                  color: '#4a4845',
                  fontSize: '13px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="">显示所有经络</option>
                {Object.values(MERIDIANS).map((meridian) => (
                  <option key={meridian.type} value={meridian.type}>
                    {meridian.name} ({meridian.pinyin})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* 透明度调节 */}
          <div>
            <div style={{ 
              fontWeight: '600', 
              color: '#4a4845', 
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              🎚️ 透明度调节
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 皮肤透明度 */}
              {showSkin && (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '4px',
                    fontSize: '12px',
                    color: '#8b8680'
                  }}>
                    <span>皮肤</span>
                    <span>{Math.round(skinOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={skinOpacity * 100}
                    onChange={(e) => setSkinOpacity(Number(e.target.value) / 100)}
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: 'linear-gradient(to right, #FAD6A5, #e8e0d5)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              )}
              
              {/* 肌肉透明度 */}
              {showMuscles && (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '4px',
                    fontSize: '12px',
                    color: '#8b8680'
                  }}>
                    <span>肌肉</span>
                    <span>{Math.round(muscleOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={muscleOpacity * 100}
                    onChange={(e) => setMuscleOpacity(Number(e.target.value) / 100)}
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: 'linear-gradient(to right, #E74C3C, #e8e0d5)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              )}
              
              {/* 骨骼透明度 */}
              {showBones && (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '4px',
                    fontSize: '12px',
                    color: '#8b8680'
                  }}>
                    <span>骨骼</span>
                    <span>{Math.round(boneOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={boneOpacity * 100}
                    onChange={(e) => setBoneOpacity(Number(e.target.value) / 100)}
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: 'linear-gradient(to right, #ECF0F1, #bdc3c7)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
