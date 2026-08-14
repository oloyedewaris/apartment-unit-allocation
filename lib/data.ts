import apartmentsJson from "@/data/apartments.json";
import assetsJson from "@/data/unit-assets.json";
import planLabelsJson from "@/data/plan-labels.json";
import type { Apartment, AssetRegistry, PlanRegistry } from "./types";

// JSON imports infer literal unions and ordinary number arrays. These runtime
// files are validated by the synchronization scripts before reaching here.
export const apartments = apartmentsJson as unknown as Apartment[];
export const assetRegistry = assetsJson as unknown as AssetRegistry;
export const planRegistry = planLabelsJson as unknown as PlanRegistry;

export const disabledUnitNumbers = new Set(assetRegistry.disabled.map(String));

export function findApartment(unitNumber: string): Apartment | undefined {
  return apartments.find((unit) => Number(unit.number_num) === Number(unitNumber));
}

export function canOpenUnit(unit: Apartment): boolean {
  return !disabledUnitNumbers.has(String(unit.number_num)) && Boolean(assetRegistry.units[unit.number_num]);
}
