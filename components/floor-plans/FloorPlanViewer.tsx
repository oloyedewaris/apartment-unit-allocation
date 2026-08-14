"use client";

import { useMemo, useState } from "react";
import { getPlanOverlay, unitsOnFloor } from "@/lib/floor-plans";
import type { Apartment, PlanRegistry } from "@/lib/types";
import { UnitLabel } from "./UnitLabel";

interface FloorPlanViewerProps {
  apartments: Apartment[];
  registry: PlanRegistry;
  initialFloor?: number;
  initialTower?: "A" | "B";
  activeUnitNumber?: string;
  showControls?: boolean;
}

export function FloorPlanViewer({
  apartments,
  registry,
  initialFloor = 1,
  initialTower = "A",
  activeUnitNumber,
  showControls = true,
}: FloorPlanViewerProps) {
  const [floor, setFloor] = useState(initialFloor);
  const [tower, setTower] = useState<"A" | "B">(initialTower);
  const floorUnits = useMemo(() => unitsOnFloor(apartments, floor, tower), [apartments, floor, tower]);
  const overlay = useMemo(() => getPlanOverlay(registry, apartments, floor, tower), [registry, apartments, floor, tower]);
  const [, , viewWidth, viewHeight] = overlay.viewBox;

  return (
    <section className="floor-plan-viewer">
      <div className="floor-plan-board" style={{ aspectRatio: `${viewWidth} / ${viewHeight}` }}>
        {/* The SVG and labels share the production viewBox, so percentages stay aligned. */}
        <img src={`/plans/floor-${floor}.svg`} alt={`Floor ${floor} plan, tower ${tower}`} />
        <div className="plan-label-layer">
          {overlay.labels.map((label) => {
            const unit = floorUnits.find((candidate) => Number(candidate.number_num) === Number(label.unit));
            return unit ? (
              <UnitLabel
                key={unit.number_num}
                unit={unit}
                label={label}
                viewWidth={viewWidth}
                viewHeight={viewHeight}
                active={Number(unit.number_num) === Number(activeUnitNumber)}
                scale={floor === 1 ? 1.2 : 1}
              />
            ) : null;
          })}
        </div>
      </div>

      {showControls && (
        <div className="plan-controls" aria-label="Floor plan controls">
          <div className="segmented-control">
            {(["A", "B"] as const).map((value) => (
              <button key={value} className={tower === value ? "selected" : ""} onClick={() => setTower(value)}>
                Tower {value}
              </button>
            ))}
          </div>
          <div className="floor-buttons">
            {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
              <button key={value} className={floor === value ? "selected" : ""} onClick={() => setFloor(value)} aria-label={`Floor ${value}`}>
                {value}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
