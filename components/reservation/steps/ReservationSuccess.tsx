import { Center } from "@chakra-ui/react";
import { formatToCurrencyNaira, type PaymentPlan } from "../payment-plans";
import { Loader } from "@/components/ui/Loader";

interface ReservationSuccessProps {
  propertyName: string;
  unitNumber: string;
  email: string;
  reservedBy: string;
  plan: PaymentPlan;
  onBackToUnit(): void;
  success: boolean
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

function inboxUrl(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (domain === "gmail.com") return "https://mail.google.com/mail/u/0/#inbox";
  if (["outlook.com", "hotmail.com", "live.com"].includes(domain)) return "https://outlook.live.com/mail/0/";
  if (domain === "yahoo.com") return "https://mail.yahoo.com/";
  return `mailto:${email}`;
}

export function ReservationSuccess({ success, propertyName, unitNumber, email, reservedBy, plan, onBackToUnit }: ReservationSuccessProps) {
  const reference = reservationReference(propertyName, unitNumber, reservedBy);

  return !success ? (
    <Center w='full' minH={'90vh'}>
      <Loader />
    </Center>
  ) : (
    <div className="reservation-success">
      <div className="reservation-success-scroll">
        <span className="reservation-success-icon" aria-hidden="true">
          <span />
        </span>
        <small>{propertyName}</small>
        <h2>Check your email to continue</h2>
        <p>
          Unit {unitNumber} is held in your name for 72 hours. Everything you need next is in the message we just sent to <strong>{email}</strong>.
        </p>

        <ol className="reservation-next-steps">
          <li>
            <span>1</span>
            <div>
              <strong>Open the reservation email</strong>
              <p>It carries your reservation form, the signed terms and your reference.</p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>Pay {formatToCurrencyNaira(plan?.initial_deposit_in_value ? plan?.initial_deposit_in_value : plan?.price)}</strong>
              <p>Card, transfer and the account details are in the email. The hold releases if payment is not received by then.</p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>We confirm allocation</strong>
              <p>Once payment clears, our sales team sends your allocation letter and the unit moves to sold in the map.</p>
            </div>
          </li>
        </ol>

        <div className="reservation-reference">
          <small>Reservation reference</small>
          <strong>{reference}</strong>
        </div>
      </div>

      <footer className="reservation-success-action">
        <a className="reservation-open-email" href={inboxUrl(email)} target="_blank" rel="noreferrer">
          Open email <span aria-hidden="true">→</span>
        </a>
        <p>
          <button type="button" onClick={onBackToUnit}>
            start again
          </button>
        </p>
      </footer>
    </div>
  );
}
