"use client";

import { useState } from "react";
import type { Apartment, PlanRegistry, UnitAsset } from "@/lib/types";
import { FloorPlanViewer } from "@/components/floor-plans/FloorPlanViewer";
import { UnitModelViewer } from "@/components/unit-model/UnitModelViewer";

export function UnitWorkspace({ unit, asset, apartments, plans }: { unit: Apartment; asset: UnitAsset; apartments: Apartment[]; plans: PlanRegistry }) {
  const [view, setView] = useState<"model" | "plan">("model");
  return (
    <main className="unit-workspace">
      <nav className="view-tabs" aria-label="Unit view">
        <button className={view === "model" ? "selected" : ""} onClick={() => setView("model")}>3D model</button>
        <button className={view === "plan" ? "selected" : ""} onClick={() => setView("plan")}>Floor plan</button>
      </nav>
      {view === "model" ? (
        <UnitModelViewer asset={asset} />
      ) : (
        <FloorPlanViewer apartments={apartments} registry={plans} initialFloor={Number(unit.floor)} initialTower={unit.house.identificator} activeUnitNumber={unit.number_num} showControls={false} />
      )}
    </main>
  );
}
