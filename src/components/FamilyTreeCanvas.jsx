import React, { useMemo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { buildFamilyTreeCanvasLayout } from '../utils/familyTreeLayout';
import FamilyTreeCanvasBlock from './FamilyTreeCanvasBlock';
import './FamilyTreeCanvas.css';

const BRANCH_ORDER = ['medina', 'shared', 'anseli'];

function FamilyTreeCanvas({ members, onSelectMember }) {
  const layout = useMemo(() => buildFamilyTreeCanvasLayout(members), [members]);
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

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
                {BRANCH_ORDER.map((branch) => (
                  <FamilyTreeCanvasBlock
                    key={branch}
                    branch={branch}
                    nodes={layout.blocksByBranch[branch].nodes}
                    connectors={layout.blocksByBranch[branch].connectors}
                    memberById={memberById}
                    canvasSize={layout.canvasSize}
                    onSelectMember={onSelectMember}
                  />
                ))}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      <div className="ftc-legend">
        <span className="ftc-legend-item"><span className="ftc-legend-swatch ftc-legend-swatch--medina"></span>Medina family</span>
        <span className="ftc-legend-item"><span className="ftc-legend-swatch ftc-legend-swatch--anseli"></span>Anseli family</span>
        <span className="ftc-legend-item"><span className="ftc-legend-swatch ftc-legend-swatch--shared"></span>Shared</span>
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
