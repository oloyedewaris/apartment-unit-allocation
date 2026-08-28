import { formatCurrency, paymentPlans } from "../payment-plans";

interface PaymentPlanStepProps {
  price: number;
  selectedPlanId: string | null;
  onSelect(planId: string): void;
  onBack(): void;
  onContinue(): void;
}

export function PaymentPlanStep({ price, selectedPlanId, onSelect, onBack, onContinue }: PaymentPlanStepProps) {
  return (
    <div className="reservation-step">
      <header className="reservation-step-header">
        <button type="button" className="reservation-back-link" onClick={onBack}>
          <span aria-hidden="true">←</span> Back
        </button>
        <p>
          Step 1 of 7 <span aria-hidden="true">·</span> Payment plan
        </p>
      </header>

      <div className="reservation-step-scroll">
        <section className="reservation-step-intro">
          <h2>How would you like to pay?</h2>
          <p>Purchase price {formatCurrency(price)}. Choose the payment structure that suits you. You can review it again before you pay.</p>
        </section>

        <fieldset className="payment-plan-list">
          <legend>Choose a payment plan</legend>
          {paymentPlans.map((plan) => {
            const selected = selectedPlanId === plan.id;
            const initialPayment = (price * plan.initialPercentage) / 100;
            return (
              <label key={plan.id} className={`payment-plan-card${selected ? " selected" : ""}`}>
                <input type="radio" name="payment-plan" value={plan.id} checked={selected} onChange={() => onSelect(plan.id)} />
                <span className="payment-plan-summary">
                  <span>
                    <strong>{plan.name}</strong>
                    <b>{formatCurrency(initialPayment)}</b>
                    {plan.id !== "outright" && <small>Initial deposit</small>}
                  </span>
                  <span className="payment-plan-radio" aria-hidden="true" />
                </span>
                <span className="payment-plan-details">
                  <span>
                    <small>Purchase price</small>
                    <strong style={{ fontSize: "20px" }}>{formatCurrency(price)}</strong>
                  </span>
                  <span>
                    <small>{plan.id === "outright" ? "Term" : "Deposit"}</small>
                    <strong style={{ fontSize: "14px" }}>{plan.term}</strong>
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>
      </div>

      <footer className="reservation-step-actions">
        <button type="button" className="secondary-action" onClick={onBack}>
          Back
        </button>
        <button type="button" className="continue-action" disabled={!selectedPlanId} onClick={onContinue}>
          Continue <span aria-hidden="true">→</span>
        </button>
      </footer>
    </div>
  );
}
