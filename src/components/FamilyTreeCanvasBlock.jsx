import React from 'react';
import FamilyTreeCanvasNode from './FamilyTreeCanvasNode';

function FamilyTreeCanvasBlock({ branch, nodes, connectors, memberById, canvasSize, onSelectMember }) {
  return (
    <>
      <svg
        className={`ftc-connectors ftc-connectors--${branch}`}
        width={canvasSize.width}
        height={canvasSize.height}
      >
        {connectors.map((c, idx) => (
          <line key={idx} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} />
        ))}
      </svg>

      {nodes.map((node) => {
        const member = memberById.get(node.id);
        if (!member) return null;
        return (
          <FamilyTreeCanvasNode
            key={node.id}
            member={member}
            x={node.x}
            y={node.y}
            branch={branch}
            onSelect={onSelectMember}
          />
        );
      })}
    </>
  );
}

export default FamilyTreeCanvasBlock;
