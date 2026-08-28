import { formatCurrency, type PaymentPlan } from "../payment-plans";

interface ReservationSuccessProps {
  propertyName: string;
  unitNumber: string;
  email: string;
  reservedBy: string;
  price: number;
  plan: PaymentPlan;
  onBackToUnit(): void;
}

function reservationReference(propertyName: string, unitNumber: string, reservedBy: string) {
  const propertyCode =
    propertyName
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .replace(/[^a-z]/gi, "")
      .slice(0, 3)
      .toUpperCase() || "MYX";
  const customerCode =
    reservedBy
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .replace(/[^a-z]/gi, "")
      .slice(0, 3)
      .toUpperCase() || "RES";
  return `${propertyCode}-${unitNumber}-${customerCode}`;
}

export function ReservationSuccess({ propertyName, unitNumber, email, reservedBy, price, plan, onBackToUnit }: ReservationSuccessProps) {
  const amountDue = (price * plan.initialPercentage) / 100;
  const reference = reservationReference(propertyName, unitNumber, reservedBy);

  return (
    <div className="reservation-success">
      <div className="reservation-success-scroll">
        <span className="reservation-success-icon" aria-hidden="true">
          ✓
        </span>
        <small>{propertyName}</small>
        <h2>Unit {unitNumber} is held in your name</h2>
        <p>
          We have emailed <strong>{email}</strong> with the reservation form, payment instructions, and a copy of the agreement. The reservation hold lasts 72
          hours.
        </p>

        <dl className="reservation-success-details">
          <div>
            <dt>Plan</dt>
            <dd>{plan.name}</dd>
          </div>
          <div>
            <dt>Due now</dt>
            <dd>{formatCurrency(amountDue)}</dd>
          </div>
          <div>
            <dt>Reserved by</dt>
            <dd>{reservedBy}</dd>
          </div>
        </dl>

        <div className="reservation-reference">
          <small>Reservation reference</small>
          <strong>{reference}</strong>
        </div>
      </div>

      <footer className="reservation-success-action">
        <button type="button" onClick={onBackToUnit}>
          Back to unit <span aria-hidden="true">→</span>
        </button>
      </footer>
    </div>
  );
}
