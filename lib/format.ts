import type { Apartment } from "./types";

export function formatPrice(unit: Apartment): string {
  if (unit.status === "sold") return "Sold";
  if (unit.status === "booked") return "Reserved";
  const price = unit.discounted_price_raw || unit.price_raw;
  return price ? `${Number(price).toLocaleString("en")} €` : "Ask price";
}

export function formatArea(unit: Apartment): string {
  return `${unit.area_size_raw || unit.area_size} m²`;
}
