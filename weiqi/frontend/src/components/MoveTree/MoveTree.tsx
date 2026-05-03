import React from 'react'
import { MoveNode } from '@/types'
import './MoveTree.css'

interface MoveTreeProps {
  rootNode: MoveNode | null
  currentNodeId: string | null
  onNodeSelect: (node: MoveNode) => void
}

interface TreeNodeProps {
  node: MoveNode
  currentNodeId: string | null
  onNodeSelect: (node: MoveNode) => void
  depth: number
  isFirst: boolean
  isLast: boolean
  siblingIndex: number
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  currentNodeId,
  onNodeSelect,
  depth,
  isFirst,
  isLast,
  siblingIndex,
}) => {
  const isSelected = node.id === currentNodeId
  const moveNumber = node.move.moveNumber + 1
  const color = node.move.color
  const hasVariation = node.children.length > 1

  const getMoveLabel = () => {
    const colLetters = 'ABCDEFGHJKLMNOPQRST'
    const col = colLetters[node.move.position.col]
    const row = node.move.boardSize - node.move.position.row
    return `${col}${row}`
  }

  return (
    <div className="tree-node">
      <div
        className={`tree-node-content ${isSelected ? 'selected' : ''} ${hasVariation ? 'has-variation' : ''}`}
        onClick={() => onNodeSelect(node)}
        style={{ marginLeft: depth * 20 }}
      >
        <span className={`move-indicator ${color}`}>
          {color === 'black' ? '●' : '○'}
        </span>
        <span className="move-number">{moveNumber}.</span>
        <span className="move-label">{getMoveLabel()}</span>
        {hasVariation && (
          <span className="variation-badge">
            {node.children.length}变
          </span>
        )}
        {node.comment && (
          <span className="comment-icon">💬</span>
        )}
      </div>
      {node.children.length > 0 && (
        <div className="tree-children">
          {node.children.map((child, index) => (
            <TreeNode
              key={child.id}
              node={child}
              currentNodeId={currentNodeId}
              onNodeSelect={onNodeSelect}
              depth={depth + 1}
              isFirst={index === 0}
              isLast={index === node.children.length - 1}
              siblingIndex={index}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const MoveTree: React.FC<MoveTreeProps> = ({
  rootNode,
  currentNodeId,
  onNodeSelect,
}) => {
  if (!rootNode) {
    return (
      <div className="move-tree empty">
        <p>暂无定式数据</p>
      </div>
    )
  }

  return (
    <div className="move-tree">
      <div className="tree-header">
        <h4>定式分支</h4>
        <div className="tree-legend">
          <span className="legend-item">
            <span className="move-indicator black">●</span> 黑方
          </span>
          <span className="legend-item">
            <span className="move-indicator white">○</span> 白方
          </span>
        </div>
      </div>
      <div className="tree-scroll">
        <TreeNode
          node={rootNode}
          currentNodeId={currentNodeId}
          onNodeSelect={onNodeSelect}
          depth={0}
          isFirst={true}
          isLast={true}
          siblingIndex={0}
        />
      </div>
    </div>
  )
}

export default MoveTree
