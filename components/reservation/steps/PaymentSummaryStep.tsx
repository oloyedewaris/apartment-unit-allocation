import { formatCurrency, type PaymentPlan } from "../payment-plans";

interface PaymentSummaryStepProps {
  unitNumber: string;
  price: number;
  plan: PaymentPlan;
  acceptedTerms: boolean;
  onAcceptedTermsChange(accepted: boolean): void;
  onBack(): void;
  onProceed(): void;
}

export function PaymentSummaryStep({ unitNumber, price, plan, acceptedTerms, onAcceptedTermsChange, onBack, onProceed }: PaymentSummaryStepProps) {
  const amountDue = (price * plan.initialPercentage) / 100;
  const balance = price - amountDue;
  const monthlyInstallment = plan.months ? balance / plan.months : null;

  return (
    <div className="reservation-step">
      <header className="reservation-step-header">
        <p>
          Step 2 of 7 <span aria-hidden="true">·</span> Payment summary
        </p>
      </header>

      <div className="reservation-step-scroll payment-summary-scroll">
        <section className="payment-summary-intro">
          <h2>Payment summary</h2>
          <div className="payment-due-now">
            <small>You will pay now</small>
            <strong>{formatCurrency(amountDue)}</strong>
          </div>
        </section>

        <dl className="payment-summary-details">
          <div>
            <dt>Unit</dt>
            <dd>Unit {unitNumber}</dd>
          </div>
          <div>
            <dt>Purchase price</dt>
            <dd>{formatCurrency(price)}</dd>
          </div>
          {plan.name !== "Outright payment" && (
            <div>
              <dt>Plan</dt>
              <dd>{plan.name}</dd>
            </div>
          )}
          {plan.name !== "Outright payment" && (
            <div>
              <dt>Balance</dt>
              <dd>{formatCurrency(balance)}</dd>
            </div>
          )}
          {plan.name !== "Outright payment" && (
            <div>
              <dt>Monthly installment</dt>
              <dd>{monthlyInstallment && plan.months ? `${formatCurrency(monthlyInstallment)} × ${plan.months}` : "Not applicable"}</dd>
            </div>
          )}
        </dl>

        <section className="payment-terms">
          <div className="payment-terms-link">
            <span>
              <span aria-hidden="true">□</span> Terms of agreement
            </span>
            <a href="#payment-terms-acceptance">View</a>
          </div>
          <label className="payment-terms-acceptance" id="payment-terms-acceptance">
            <input type="checkbox" checked={acceptedTerms} onChange={(event) => onAcceptedTermsChange(event.target.checked)} />
            <span>I have reviewed the terms of agreement, including the payment schedule and forfeiture conditions, and I accept them.</span>
          </label>
        </section>
      </div>

      <footer className="reservation-step-actions">
        <button type="button" className="secondary-action" onClick={onBack}>
          Back
        </button>
        <button type="button" className="continue-action" disabled={!acceptedTerms} onClick={onProceed}>
          Proceed <span aria-hidden="true">→</span>
        </button>
      </footer>
    </div>
  );
}
