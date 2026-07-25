import React, { useMemo, useState } from 'react';
import { TransformWrapper, TransformComponent, MiniMap } from 'react-zoom-pan-pinch';
import { buildFamilyTreeCanvasLayout, CARD_HEIGHT } from '../utils/familyTreeLayout';
import FamilyTreeCanvasBlock from './FamilyTreeCanvasBlock';
import './FamilyTreeCanvas.css';

const BRANCH_ORDER = ['medina', 'shared', 'anseli'];

function computeFocusSet(hoveredId, members) {
  if (!hoveredId) return null;
  const byId = new Map(members.map((m) => [m.id, m]));
  const hovered = byId.get(hoveredId);
  if (!hovered) return null;

  const set = new Set([hoveredId]);
  const parentIds = hovered.parentIds || [];

  parentIds.forEach((parentId) => {
    set.add(parentId);
    const parent = byId.get(parentId);
    (parent?.parentIds || []).forEach((grandparentId) => set.add(grandparentId));
  });

  (hovered.spouseIds || []).forEach((spouseId) => set.add(spouseId));

  if (parentIds.length > 0) {
    members.forEach((m) => {
      if (m.id === hoveredId) return;
      const isSibling = (m.parentIds || []).some((id) => parentIds.includes(id));
      if (isSibling) set.add(m.id);
    });
  }

  members.forEach((m) => {
    if ((m.parentIds || []).includes(hoveredId)) set.add(m.id);
  });

  return set;
}

function FamilyTreeCanvas({ members, onSelectMember }) {
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());
  const [hoveredId, setHoveredId] = useState(null);

  const layout = useMemo(
    () => buildFamilyTreeCanvasLayout(members, { collapsedIds }),
    [members, collapsedIds]
  );
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const focusSet = useMemo(() => computeFocusSet(hoveredId, members), [hoveredId, members]);

  const handleToggleCollapse = (memberId) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const handleHoverStart = (memberId) => setHoveredId(memberId);
  const handleHoverEnd = () => setHoveredId(null);

  if (!layout.ready) {
    return (
      <div className="ftc-empty-state">
        <p>{layout.message}</p>
      </div>
    );
  }

  return (
    <div className="ftc-wrapper">
      <TransformWrapper
        minScale={0.2}
        maxScale={2.5}
        initialScale={0.55}
        centerOnInit
        wheel={{ step: 0.15 }}
        doubleClick={{ mode: 'zoomIn' }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="ftc-toolbar">
              <button type="button" onClick={() => zoomIn()} aria-label="Zoom in">+</button>
              <button type="button" onClick={() => zoomOut()} aria-label="Zoom out">−</button>
              <button type="button" onClick={() => resetTransform()} aria-label="Reset view">Reset</button>
            </div>

            <TransformComponent
              wrapperClass="ftc-transform-wrapper"
              contentClass="ftc-transform-content"
              wrapperStyle={{ width: '100%', height: '70vh', minHeight: 480, overflow: 'hidden' }}
            >
              <div
                className="ftc-canvas"
                style={{ width: layout.canvasSize.width, height: layout.canvasSize.height }}
              >
                {layout.rows.map((row) => (
                  <div
                    key={row.level}
                    className="ftc-row-marker"
                    style={{ top: row.y + CARD_HEIGHT / 2 }}
                  >
                    <span className="ftc-row-label">{row.title}</span>
                    <span className="ftc-row-line" />
                  </div>
                ))}

                {BRANCH_ORDER.map((branch) => (
                  <FamilyTreeCanvasBlock
                    key={branch}
                    branch={branch}
                    nodes={layout.blocksByBranch[branch].nodes}
                    connectors={layout.blocksByBranch[branch].connectors}
                    memberById={memberById}
                    canvasSize={layout.canvasSize}
                    focusSet={focusSet}
                    onSelectMember={onSelectMember}
                    onToggleCollapse={handleToggleCollapse}
                    onHoverStart={handleHoverStart}
                    onHoverEnd={handleHoverEnd}
                  />
                ))}
              </div>
            </TransformComponent>

            <MiniMap
              width={220}
              height={140}
              borderColor="#B8956A"
              className="ftc-minimap"
              wrapperClassName="ftc-minimap-inner"
            >
              <div
                className="ftc-minimap-canvas"
                style={{ width: layout.canvasSize.width, height: layout.canvasSize.height }}
              >
                {BRANCH_ORDER.map((branch) =>
                  layout.blocksByBranch[branch].nodes.map((node) => (
                    <span
                      key={node.id}
                      className={`ftc-minimap-dot ftc-minimap-dot--${branch}`}
                      style={{ left: node.x, top: node.y }}
                    />
                  ))
                )}
              </div>
            </MiniMap>
          </>
        )}
      </TransformWrapper>

      <div className="ftc-legend">
        <span className="ftc-legend-item"><span className="ftc-legend-swatch ftc-legend-swatch--medina"></span>Medina family</span>
        <span className="ftc-legend-item"><span className="ftc-legend-swatch ftc-legend-swatch--anseli"></span>Anseli family</span>
        <span className="ftc-legend-item"><span className="ftc-legend-swatch ftc-legend-swatch--shared"></span>You &amp; Direct Family</span>
        <span className="ftc-legend-item"><span className="ftc-legend-line ftc-legend-line--spouse"></span>Marriage</span>
        <span className="ftc-legend-item"><span className="ftc-legend-line ftc-legend-line--parent"></span>Parent → Child</span>
      </div>

      {layout.unplaced.length > 0 && (
        <div className="ftc-unplaced">
          <h4>Unplaced Relatives</h4>
          <p>
            These members aren&apos;t connected to the canvas yet — add a branch tag, parent, or
            spouse link so they can be placed.
          </p>
          <div className="ftc-unplaced-list">
            {layout.unplaced.map((member) => (
              <div
                key={member.id}
                className="ftc-unplaced-card"
                onClick={() => onSelectMember(member)}
              >
                <span className="ftc-unplaced-name">{member.name || 'Unnamed member'}</span>
                <span className="ftc-unplaced-reason">
                  {member.branch ? 'Not connected to the tree' : 'No branch assigned'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FamilyTreeCanvas;
