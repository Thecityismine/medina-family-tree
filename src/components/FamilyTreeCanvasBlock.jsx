import React from 'react';
import FamilyTreeCanvasNode from './FamilyTreeCanvasNode';

function FamilyTreeCanvasBlock({
  branch,
  nodes,
  connectors,
  memberById,
  canvasSize,
  focusSet,
  onSelectMember,
  onToggleCollapse,
  onHoverStart,
  onHoverEnd
}) {
  return (
    <>
      <svg
        className={`ftc-connectors ftc-connectors--${branch}`}
        width={canvasSize.width}
        height={canvasSize.height}
      >
        {connectors.map((c, idx) => {
          const isDimmed = focusSet ? !(focusSet.has(c.fromId) && focusSet.has(c.toId)) : false;
          return (
            <line
              key={idx}
              className={`ftc-connector-line ftc-connector-line--${c.type}${isDimmed ? ' ftc-connector-line--dimmed' : ''}`}
              x1={c.x1}
              y1={c.y1}
              x2={c.x2}
              y2={c.y2}
            />
          );
        })}
      </svg>

      {nodes.map((node) => {
        const member = memberById.get(node.id);
        if (!member) return null;
        const dimmed = focusSet ? !focusSet.has(node.id) : false;
        return (
          <FamilyTreeCanvasNode
            key={node.id}
            member={member}
            x={node.x}
            y={node.y}
            branch={branch}
            childCount={node.childCount}
            isCollapsed={node.isCollapsed}
            dimmed={dimmed}
            onSelect={onSelectMember}
            onToggleCollapse={onToggleCollapse}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
          />
        );
      })}
    </>
  );
}

export default FamilyTreeCanvasBlock;
