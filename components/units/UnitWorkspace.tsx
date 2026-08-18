"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Apartment, PlanRegistry, UnitAsset } from "@/lib/types";
import { Loader } from "@/components/ui/Loader";

const FloorPlanViewer = dynamic(() => import("@/components/floor-plans/FloorPlanViewer").then((module) => module.FloorPlanViewer), {
  loading: () => (
    <div className="plan-loading">
      <Loader />
    </div>
  ),
});
const UnitModelViewer = dynamic(() => import("@/components/unit-model/UnitModelViewer").then((module) => module.UnitModelViewer), {
  ssr: false,
  loading: () => (
    <div className="model-state">
      <Loader />
    </div>
  ),
});

export function UnitWorkspace({ unit, asset, apartments, plans }: { unit: Apartment; asset: UnitAsset; apartments: Apartment[]; plans: PlanRegistry }) {
  const [view, setView] = useState<"plan" | "model" | "interior">("plan");
  return (
    <main className="unit-workspace" id="unit-stage">
      <nav className="view-tabs" aria-label="Unit view">
        <button className={view === "plan" ? "selected" : ""} onClick={() => setView("plan")}>
          Plan
        </button>
        <button className={view === "model" ? "selected" : ""} onClick={() => setView("model")}>
          3D
        </button>
        <button className={view === "interior" ? "selected" : ""} onClick={() => setView("interior")}>
          Interior
        </button>
      </nav>
      {view === "plan" ? (
        <FloorPlanViewer
          apartments={apartments}
          registry={plans}
          initialFloor={Number(unit.floor)}
          initialTower={unit.house.identificator}
          activeUnitNumber={unit.number_num}
          showControls={false}
        />
      ) : (
        <UnitModelViewer asset={asset} floor={Number(unit.floor)} startInTour={view === "interior"} />
      )}
      {view === "plan" && (
        <aside className="unit-floor-stack" aria-label={`Floor ${unit.floor} in tower ${unit.house.identificator}`}>
          <small>Tower {unit.house.identificator}</small>
          <div>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((floor) => (
              <span key={floor} className={floor === Number(unit.floor) ? "active" : ""} />
            ))}
          </div>
          <p>Floor {unit.floor} of 12</p>
        </aside>
      )}
    </main>
  );
}
