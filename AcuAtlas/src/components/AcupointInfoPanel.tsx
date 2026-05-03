import { Acupoint, MeridianType } from '../types';
import { MERIDIAN_COLORS, MERIDIANS } from '../data/acupointData';

// 特殊穴位标签
const SPECIAL_POINT_LABELS: Record<string, { label: string; color: string }> = {
  isFrontMu: { label: '募穴', color: '#9B59B6' },
  isBackShu: { label: '俞穴', color: '#3498DB' },
  isYuanSource: { label: '原穴', color: '#D4AF37' },
  isLuoConnecting: { label: '络穴', color: '#1ABC9C' },
  isXiCleft: { label: '郄穴', color: '#E67E22' },
  isHeSea: { label: '合穴', color: '#2ECC71' },
  isJingRiver: { label: '经穴', color: '#3498DB' },
  isShuStream: { label: '输穴', color: '#27AE60' },
  isYingSpring: { label: '荥穴', color: '#F39C12' },
  isJingWell: { label: '井穴', color: '#E74C3C' },
  isEightConfluence: { label: '八脉交会穴', color: '#8E44AD' },
  isInfluential: { label: '八会穴', color: '#F1C40F' }
};

interface AcupointInfoPanelProps {
  acupoint: Acupoint;
  onClose: () => void;
}

export function AcupointInfoPanel({ acupoint, onClose }: AcupointInfoPanelProps) {
  const getMeridianInfo = () => {
    if ((acupoint as any).type === 'meridian') {
      return MERIDIANS[(acupoint as any).meridian as keyof typeof MERIDIANS];
    }
    return null;
  };
  
  const meridian = getMeridianInfo();
  
  const getSpecialLabels = () => {
    const labels: { label: string; color: string }[] = [];
    
    for (const [key, info] of Object.entries(SPECIAL_POINT_LABELS)) {
      if (key in acupoint && (acupoint as any)[key]) {
        labels.push(info);
      }
    }
    
    return labels;
  };
  
  const specialLabels = getSpecialLabels();
  
  const layerNames: Record<string, string> = {
    skin: '皮',
    flesh: '肉',
    vessel: '脉',
    tendon: '筋',
    bone: '骨'
  };

  return (
    <div 
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '320px',
        background: 'rgba(248, 245, 240, 0.98)',
        border: '1px solid #e8e0d5',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
        overflow: 'hidden'
      }}
    >
      <div 
        style={{
          padding: '16px 20px',
          background: meridian 
            ? `linear-gradient(135deg, ${MERIDIAN_COLORS[(acupoint as any).meridian as MeridianType] || '#D4AF37'}20, transparent)`
            : 'transparent',
          borderBottom: '1px solid #e8e0d5'
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '8px'
        }}>
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '4px'
            }}>
              <span style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                color: '#4a4845' 
              }}>
                {(acupoint as any).name}
              </span>
              <span style={{ 
                fontSize: '14px', 
                color: '#8b8680',
                background: 'rgba(240, 230, 214, 0.8)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {(acupoint as any).id}
              </span>
            </div>
            <div style={{ 
              fontSize: '13px', 
              color: '#8b8680',
              fontStyle: 'italic'
            }}>
              {(acupoint as any).pinyin}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(232, 224, 213, 0.8)',
              color: '#8b8680',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E74C3C';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(232, 224, 213, 0.8)';
              e.currentTarget.style.color = '#8b8680';
            }}
          >
            ✕
          </button>
        </div>
        
        {meridian && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: MERIDIAN_COLORS[(acupoint as any).meridian as MeridianType] || '#D4AF37'
            }} />
            <span style={{ fontSize: '13px', color: '#4a4845' }}>
              {meridian.name}
            </span>
            {(acupoint as any).type === 'meridian' && (
              <span style={{ 
                fontSize: '12px', 
                color: '#8b8680',
                background: 'rgba(232, 224, 213, 0.6)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                第 {(acupoint as any).meridianOrder} 穴
              </span>
            )}
          </div>
        )}
        
        {specialLabels.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '6px',
            marginTop: '12px'
          }}>
            {specialLabels.map((label, index) => (
              <span
                key={index}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'white',
                  background: label.color
                }}
              >
                {label.label}
              </span>
            ))}
          </div>
        )}
        
        {(acupoint as any).alternativeNames && (acupoint as any).alternativeNames.length > 0 && (
          <div style={{ 
            marginTop: '12px', 
            fontSize: '12px', 
            color: '#8b8680' 
          }}>
            <span style={{ fontWeight: '600' }}>别名：</span>
            {(acupoint as any).alternativeNames.join('、')}
          </div>
        )}
      </div>
      
      {/* 内容区域 */}
      <div style={{ 
        padding: '16px 20px', 
        maxHeight: '400px', 
        overflowY: 'auto' 
      }}>
        {/* 定位 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            fontWeight: '600', 
            color: '#4a4845', 
            marginBottom: '8px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>📍</span> 定位
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#4a4845', 
            lineHeight: '1.6',
            background: 'rgba(240, 230, 214, 0.5)',
            padding: '12px',
            borderRadius: '8px'
          }}>
            {acupoint.location.description}
          </div>
        </div>
        
        {/* 进针 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            fontWeight: '600', 
            color: '#4a4845', 
            marginBottom: '8px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>🪡</span> 进针
          </div>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px',
            marginBottom: '8px'
          }}>
            <div style={{
              background: 'rgba(52, 152, 219, 0.1)',
              padding: '8px 12px',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '11px', color: '#8b8680', marginBottom: '2px' }}>
                标准深度
              </div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                color: '#3498DB' 
              }}>
                {acupoint.needling.standardDepth}mm
              </div>
            </div>
            <div style={{
              background: 'rgba(231, 76, 60, 0.1)',
              padding: '8px 12px',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '11px', color: '#8b8680', marginBottom: '2px' }}>
                最大深度
              </div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '700', 
                color: '#E74C3C' 
              }}>
                {acupoint.needling.maxDepth}mm
              </div>
            </div>
          </div>
          
          {/* 进针方向 */}
          <div style={{ 
            fontSize: '12px', 
            color: '#4a4845',
            marginBottom: '8px'
          }}>
            <span style={{ fontWeight: '600' }}>进针方向：</span>
            {acupoint.needling.directions.join('、')}
          </div>
          
          {/* 进针层次 */}
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            alignItems: 'center',
            marginTop: '8px'
          }}>
            <span style={{ fontSize: '12px', color: '#8b8680', fontWeight: '600' }}>层次：</span>
            {acupoint.needling.layers.map((layer, index) => (
              <span
                key={layer}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: '#4a4845'
                }}
              >
                {index > 0 && <span style={{ color: '#bdc3c7' }}>→</span>}
                <span style={{ fontWeight: '500' }}>{layerNames[layer]}</span>
              </span>
            ))}
          </div>
          
          {/* 注意事项 */}
          {acupoint.needling.precautions && (
            <div style={{ 
              marginTop: '10px',
              padding: '8px 12px',
              background: 'rgba(231, 76, 60, 0.08)',
              borderRadius: '6px',
              border: '1px solid rgba(231, 76, 60, 0.2)',
              fontSize: '12px',
              color: '#C0392B'
            }}>
              ⚠️ {acupoint.needling.precautions}
            </div>
          )}
        </div>
        
        {/* 主治 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            fontWeight: '600', 
            color: '#4a4845', 
            marginBottom: '8px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>💊</span> 主治病症
          </div>
          
          {/* 主要主治 */}
          {acupoint.indications.primary.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#8b8680', 
                marginBottom: '4px',
                fontWeight: '600'
              }}>
                主要：
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {acupoint.indications.primary.map((indication, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '4px 10px',
                      background: 'rgba(46, 204, 113, 0.15)',
                      color: '#27AE60',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {indication}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* 传统主治 */}
          {acupoint.indications.traditional.length > 0 && (
            <div>
              <div style={{ 
                fontSize: '12px', 
                color: '#8b8680', 
                marginBottom: '4px',
                fontWeight: '600'
              }}>
                传统主治：
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: '#4a4845', 
                lineHeight: '1.6' 
              }}>
                {acupoint.indications.traditional.join('；')}
              </div>
            </div>
          )}
        </div>
        
        {/* 得气感 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            fontWeight: '600', 
            color: '#4a4845', 
            marginBottom: '8px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>✨</span> 得气感
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {acupoint.deqiSensation.map((sensation, index) => (
              <span
                key={index}
                style={{
                  padding: '6px 14px',
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(243, 156, 18, 0.2))',
                  color: '#B7950B',
                  borderRadius: '16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: '1px solid rgba(212, 175, 55, 0.3)'
                }}
              >
                {sensation}
              </span>
            ))}
          </div>
        </div>
        
        {/* 解剖 */}
        <div>
          <div style={{ 
            fontWeight: '600', 
            color: '#4a4845', 
            marginBottom: '8px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>🔬</span> 解剖层次
          </div>
          <div style={{ 
            background: 'rgba(236, 240, 241, 0.5)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            lineHeight: '1.8'
          }}>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontWeight: '600', color: '#8b8680' }}>皮肤：</span>
              <span style={{ color: '#4a4845' }}>{acupoint.anatomy.skin}</span>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontWeight: '600', color: '#8b8680' }}>皮下组织：</span>
              <span style={{ color: '#4a4845' }}>{acupoint.anatomy.subcutaneous}</span>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontWeight: '600', color: '#8b8680' }}>肌肉：</span>
              <span style={{ color: '#4a4845' }}>{acupoint.anatomy.muscle}</span>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontWeight: '600', color: '#8b8680' }}>血管：</span>
              <span style={{ color: '#4a4845' }}>{acupoint.anatomy.vessels}</span>
            </div>
            <div>
              <span style={{ fontWeight: '600', color: '#8b8680' }}>神经：</span>
              <span style={{ color: '#4a4845' }}>{acupoint.anatomy.nerves}</span>
            </div>
          </div>
        </div>
        
        {/* 配伍 */}
        {acupoint.combinations && acupoint.combinations.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ 
              fontWeight: '600', 
              color: '#4a4845', 
              marginBottom: '8px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>🤝</span> 穴位配伍
            </div>
            {acupoint.combinations.map((combo, index) => (
              <div 
                key={index}
                style={{
                  padding: '10px',
                  background: 'rgba(240, 230, 214, 0.5)',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  fontSize: '12px',
                  lineHeight: '1.5'
                }}
              >
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', color: '#4a4845' }}>
                    配 {combo.with}
                  </span>
                </div>
                <div style={{ color: '#8b8680' }}>
                  {combo.indication}
                </div>
                <div style={{ 
                  marginTop: '4px', 
                  color: '#27AE60', 
                  fontSize: '11px' 
                }}>
                  方法：{combo.method}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 底部操作区 */}
      <div style={{ 
        padding: '12px 20px', 
        borderTop: '1px solid #e8e0d5',
        display: 'flex',
        gap: '10px'
      }}>
        <button
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #e8e0d5',
            background: 'rgba(240, 230, 214, 0.5)',
            color: '#4a4845',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e8e0d5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(240, 230, 214, 0.5)';
          }}
        >
          📖 添加到收藏
        </button>
        <button
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #F39C12, #E67E22)',
            color: 'white',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(243, 156, 18, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(243, 156, 18, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(243, 156, 18, 0.3)';
          }}
        >
          🎯 开始练习
        </button>
      </div>
    </div>
  );
}
