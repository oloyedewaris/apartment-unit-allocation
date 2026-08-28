export interface PaymentPlan {
  id: string;
  name: string;
  initialPercentage: number;
  months: number | null;
  term: string;
}

export const paymentPlans: PaymentPlan[] = [
  { id: "outright", name: "Outright payment", initialPercentage: 100, months: null, term: "Single payment" },
  { id: "six-months", name: "6 month plan", initialPercentage: 20, months: 6, term: "20% · 6 months" },
  { id: "twelve-months", name: "12 month plan", initialPercentage: 30, months: 12, term: "30% · 12 months" },
  { id: "twenty-four-months", name: "24 month plan", initialPercentage: 40, months: 24, term: "40% · 24 months" },
];

export function formatCurrency(value: number) {
  return `${value.toLocaleString("en", { maximumFractionDigits: 0 })} €`;
}
