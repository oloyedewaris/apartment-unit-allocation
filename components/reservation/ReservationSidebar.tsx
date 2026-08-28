"use client";

import { useState } from "react";
import { paymentPlans } from "./payment-plans";
import { AboutYouStep, type AboutYouValues } from "./steps/AboutYouStep";
import { ContactStep } from "./steps/ContactStep";
import { DocumentsStep, type DocumentFiles } from "./steps/DocumentsStep";
import { NextOfKinStep, type NextOfKinValues } from "./steps/NextOfKinStep";
import { PaymentPlanStep } from "./steps/PaymentPlanStep";
import { PaymentSummaryStep } from "./steps/PaymentSummaryStep";
import { ReservationSuccess } from "./steps/ReservationSuccess";
import { VerificationStep } from "./steps/VerificationStep";

interface SalesContact {
  name: string;
  role: string;
  whatsappLink: string;
  email: string;
  img: string;
}

interface ReservationSidebarProps {
  unitNumber: string;
  propertyName: string;
  price: number;
  bookingUrl: string | null;
  salesEmail: string;
  salesSubject: string;
  contacts: SalesContact[];
}

const emptyAboutYou: AboutYouValues = { fullName: "", dateOfBirth: "", maritalStatus: "", gender: "", education: "" };
const emptyNextOfKin: NextOfKinValues = { fullName: "", email: "", countryCode: "+234", phoneNumber: "", relationship: "", residentialAddress: "" };

export function ReservationSidebar({ unitNumber, propertyName, price, bookingUrl, salesEmail, salesSubject, contacts }: ReservationSidebarProps) {
  const [step, setStep] = useState<
    "overview" | "payment-plan" | "payment-summary" | "contact" | "verification" | "about-you" | "next-of-kin" | "documents" | "success"
  >("overview");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [aboutYou, setAboutYou] = useState<AboutYouValues>(emptyAboutYou);
  const [nextOfKin, setNextOfKin] = useState<NextOfKinValues>(emptyNextOfKin);
  const [documents, setDocuments] = useState<DocumentFiles>({ governmentId: null, utilityBill: null });
  const selectedPlan = paymentPlans.find((plan) => plan.id === selectedPlanId);
  const selectPaymentPlan = (planId: string) => {
    if (planId !== selectedPlanId) setAcceptedTerms(false);
    setSelectedPlanId(planId);
  };
  const returnToUnit = () => {
    setStep("overview");
    setSelectedPlanId(null);
    setAcceptedTerms(false);
    setEmail("");
    setVerificationCode("");
    setAboutYou(emptyAboutYou);
    setNextOfKin(emptyNextOfKin);
    setDocuments({ governmentId: null, utilityBill: null });
  };

  if (step === "payment-plan") {
    return (
      <aside className="sales-panel reservation-flow-panel">
        <PaymentPlanStep
          price={price}
          selectedPlanId={selectedPlanId}
          onSelect={selectPaymentPlan}
          onBack={() => setStep("overview")}
          onContinue={() => {
            if (selectedPlanId) setStep("payment-summary");
          }}
        />
      </aside>
    );
  }

  if (step === "payment-summary" && selectedPlan) {
    return (
      <aside className="sales-panel reservation-flow-panel">
        <PaymentSummaryStep
          unitNumber={unitNumber}
          price={price}
          plan={selectedPlan}
          acceptedTerms={acceptedTerms}
          onAcceptedTermsChange={setAcceptedTerms}
          onBack={() => setStep("payment-plan")}
          onProceed={() => {
            if (acceptedTerms) setStep("contact");
          }}
        />
      </aside>
    );
  }

  if (step === "contact") {
    return (
      <aside className="sales-panel reservation-flow-panel">
        <ContactStep
          unitNumber={unitNumber}
          email={email}
          onEmailChange={(nextEmail) => {
            if (nextEmail !== email) setVerificationCode("");
            setEmail(nextEmail);
          }}
          onBack={() => setStep("payment-summary")}
          onSendCode={() => {
            setEmail(email.trim());
            setVerificationCode("");
            setStep("verification");
          }}
        />
      </aside>
    );
  }

  if (step === "verification") {
    return (
      <aside className="sales-panel reservation-flow-panel">
        <VerificationStep
          email={email}
          code={verificationCode}
          onCodeChange={setVerificationCode}
          onChangeAddress={() => setStep("contact")}
          onBack={() => setStep("contact")}
          onResend={() => undefined}
          onVerify={() => {
            if (/^\d{6}$/.test(verificationCode)) setStep("about-you");
          }}
        />
      </aside>
    );
  }

  if (step === "about-you") {
    return (
      <aside className="sales-panel reservation-flow-panel">
        <AboutYouStep values={aboutYou} onChange={setAboutYou} onBack={() => setStep("verification")} onContinue={() => setStep("next-of-kin")} />
      </aside>
    );
  }

  if (step === "next-of-kin") {
    return (
      <aside className="sales-panel reservation-flow-panel">
        <NextOfKinStep values={nextOfKin} onChange={setNextOfKin} onBack={() => setStep("about-you")} onContinue={() => setStep("documents")} />
      </aside>
    );
  }

  if (step === "documents") {
    return (
      <aside className="sales-panel reservation-flow-panel">
        <DocumentsStep files={documents} onChange={setDocuments} onBack={() => setStep("next-of-kin")} onProceed={() => setStep("success")} />
      </aside>
    );
  }

  if (step === "success" && selectedPlan) {
    return (
      <aside className="sales-panel reservation-flow-panel">
        <ReservationSuccess
          propertyName={propertyName}
          unitNumber={unitNumber}
          email={email}
          reservedBy={aboutYou.fullName}
          price={price}
          plan={selectedPlan}
          onBackToUnit={returnToUnit}
        />
      </aside>
    );
  }

  return (
    <aside className="sales-panel">
      <section className="reservation-block">
        <small>Your new home</small>
        <h2>
          {bookingUrl ? "Reserve" : "Ask about"} unit {unitNumber} {bookingUrl ? "in your name" : "with our sales team"}
        </h2>
        <p>
          {bookingUrl
            ? "Tell us a few things about yourself, review the price and payment options, and decide from there."
            : "Get the full specification, payment schedule and current availability directly from our sales team."}
        </p>
        {bookingUrl ? (
          <button className="primary-button" type="button" onClick={() => setStep("payment-plan")}>
            Reserve this unit <span aria-hidden="true">→</span>
          </button>
        ) : (
          <a className="primary-button" href={salesEmail}>
            Request information <span aria-hidden="true">→</span>
          </a>
        )}
      </section>

      <section className="sales-contact">
        <small>Your sales contact</small>
        {contacts.map((contact) => (
          <div key={contact.name} className="contact-card">
            <img className="contact-avatar" src={contact.img} alt="" />
            <div className="contact-details">
              <h3>{contact.name}</h3>
              <p>{contact.role}</p>
              <a href={`mailto:${contact.email}?subject=${salesSubject}`}>{contact.email}</a>
            </div>
            <div className="contact-actions">
              <a
                className="contact-action"
                href={contact.whatsappLink.replace(/unit%2061/i, `unit%20${encodeURIComponent(unitNumber)}`)}
                aria-label={`Message ${contact.name} on WhatsApp`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2C6.6 2 2.18 6.42 2.18 11.86c0 1.74.46 3.44 1.32 4.94L2 22l5.35-1.4a9.82 9.82 0 0 0 4.69 1.19c5.43 0 9.85-4.42 9.85-9.86A9.79 9.79 0 0 0 12.04 2zm0 17.94a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.1.81.83-3.02-.2-.31a8.13 8.13 0 0 1-1.25-4.34c0-4.52 3.68-8.2 8.2-8.2a8.15 8.15 0 0 1 8.19 8.2c0 4.52-3.68 8.18-8.19 8.18z" />
                  <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.71 2-1.4.25-.69.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35z" />
                </svg>
              </a>
              <a className="contact-action" href={`mailto:${contact.email}?subject=${salesSubject}`} aria-label={`Email ${contact.name}`}>
                ✉
              </a>
            </div>
          </div>
        ))}
        <a
          className="share-unit"
          href={`mailto:?subject=${encodeURIComponent(`Myxellia unit ${unitNumber}`)}&body=${encodeURIComponent(`Take a look at Myxellia unit ${unitNumber}: /units/${unitNumber}`)}`}
        >
          Send to a friend
        </a>
      </section>
    </aside>
  );
}
