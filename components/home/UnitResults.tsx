import { useEffect, useMemo, useRef } from "react";
import { canOpenUnit, sortUnitsByFloorDescending } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import type { Apartment } from "@/lib/types";

interface UnitResultsProps {
  units: Apartment[];
  total: number;
  search: string;
  hoveredNumber: string | null;
  selectedNumber: string | null;
  onSearch(value: string): void;
  onHover(number: string | null): void;
  onSelect(number: string): void;
}

export function UnitResults({ units, total, search, hoveredNumber, selectedNumber, onSearch, onHover, onSelect }: UnitResultsProps) {
  const rows = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = rows.current;
    const row = hoveredNumber ? container?.querySelector<HTMLElement>(`[data-number="${hoveredNumber}"]`) : null;
    if (!container || !row) return;

    const rowTop = row.offsetTop;
    const rowBottom = rowTop + row.offsetHeight;
    const visibleTop = container.scrollTop;
    const visibleBottom = visibleTop + container.clientHeight;

    if (rowTop < visibleTop) container.scrollTo({ top: rowTop, behavior: "smooth" });
    else if (rowBottom > visibleBottom) container.scrollTo({ top: rowBottom - container.clientHeight, behavior: "smooth" });
  }, [hoveredNumber]);
  const available = useMemo(() => units.filter((unit) => unit.status === "available").length, [units]);
  const sortedUnits = useMemo(() => sortUnitsByFloorDescending(units), [units]);
  return (
    <aside className="results-sidebar">
      <header>
        <span>Units</span>
        <span>
          {units.length} of {total} · {available} available
        </span>
      </header>
      <div className="result-search">
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          type="search"
          placeholder="115, floor 5-9, tower B, 3 rooms"
          aria-label="Search units"
        />
      </div>
      <div className="result-columns" style={{ display: "flex" }}>
        <span style={{ width: "15%" }}>No.</span>
        <span style={{ width: "10%" }}>Twr</span>
        <span style={{ width: "20%" }}>Fl</span>
        <span style={{ width: "5%" }}>Rm</span>
        <span style={{ width: "15%" }}>m²</span>
        <span style={{ width: "35%" }}>Price</span>
      </div>
      <div className="result-rows" ref={rows}>
        {sortedUnits.map((unit) => {
          const disabled = !canOpenUnit(unit);
          return (
            <button
              key={unit.id}
              data-number={unit.number_num}
              aria-disabled={disabled}
              style={{ display: "flex" }}
              className={`result-row${hoveredNumber === unit.number_num ? " hovered" : ""}${selectedNumber === unit.number_num ? " selected" : ""}${disabled ? " disabled" : ""}`}
              onMouseEnter={() => onHover(unit.number_num)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(unit.number_num)}
              onBlur={() => onHover(null)}
              onClick={() => {
                if (!disabled) onSelect(unit.number_num);
              }}
            >
              <strong style={{ width: "15% !important" }}>{unit.number}</strong>
              <span style={{ width: "10% !important" }}>{unit.house.identificator}</span>
              <span style={{ width: "20% !important" }}>{unit.floor}</span>
              <span style={{ width: "5% !important" }}>{unit.rooms_count || "-"}</span>
              <span style={{ width: "15% !important" }}>{unit.area_size_raw}</span>
              <span style={{ width: "35% !important" }}>{formatPrice(unit)}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
