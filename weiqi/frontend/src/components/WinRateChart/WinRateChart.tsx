import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { StoneColor } from '@/types'
import './WinRateChart.css'

interface WinRateDataPoint {
  moveNumber: number
  winRate: number
  color: StoneColor
  isBadMove?: boolean
  isDoubtfulMove?: boolean
  isGoodMove?: boolean
}

interface WinRateChartProps {
  data: WinRateDataPoint[]
  currentMoveIndex: number
  onMoveClick?: (moveNumber: number) => void
  height?: number
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: WinRateDataPoint }[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="chart-tooltip">
        <p className="tooltip-move">第 {data.moveNumber + 1} 手</p>
        <p className="tooltip-rate">
          黑方胜率: <span className="rate-value">{(data.winRate * 100).toFixed(1)}%</span>
        </p>
        <p className="tooltip-rate">
          白方胜率: <span className="rate-value">{((1 - data.winRate) * 100).toFixed(1)}%</span>
        </p>
        {data.isBadMove && <p className="tooltip-badge bad">恶手</p>}
        {data.isDoubtfulMove && <p className="tooltip-badge doubtful">疑问手</p>}
        {data.isGoodMove && <p className="tooltip-badge good">好手</p>}
      </div>
    )
  }
  return null
}

const WinRateChart: React.FC<WinRateChartProps> = ({
  data,
  currentMoveIndex,
  onMoveClick,
  height = 200,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="win-rate-chart empty">
        <p>暂无胜率数据</p>
      </div>
    )
  }

  const chartData = data.map((item) => ({
    ...item,
    winRatePercent: item.winRate * 100,
  }))

  return (
    <div className="win-rate-chart">
      <div className="chart-header">
        <h4>胜率曲线</h4>
        <div className="legend">
          <span className="legend-item">
            <span className="legend-dot black" /> 黑方
          </span>
          <span className="legend-item">
            <span className="legend-dot white" /> 白方
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          onClick={(e) => {
            if (onMoveClick && e?.activePayload?.[0]) {
              onMoveClick(e.activePayload[0].payload.moveNumber)
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#4a3728" opacity={0.3} />
          <XAxis
            dataKey="moveNumber"
            stroke="#8b7355"
            tick={{ fontSize: 12, fill: '#c9b99a' }}
            tickFormatter={(value) => `${value + 1}`}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#8b7355"
            tick={{ fontSize: 12, fill: '#c9b99a' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine y={50} stroke="#6b5344" strokeDasharray="5 5" />

          {currentMoveIndex >= 0 && (
            <ReferenceLine
              x={currentMoveIndex}
              stroke="#FFD700"
              strokeWidth={2}
              strokeDasharray="3 3"
            />
          )}

          <Line
            type="monotone"
            dataKey="winRatePercent"
            stroke="#1a1a1a"
            strokeWidth={2}
            dot={({ payload }) => {
              if (payload.isBadMove) return { fill: '#FF4444', r: 4 }
              if (payload.isDoubtfulMove) return { fill: '#FF9800', r: 4 }
              if (payload.isGoodMove) return { fill: '#4CAF50', r: 4 }
              return false
            }}
            activeDot={{ r: 6, fill: '#FFD700' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default WinRateChart
