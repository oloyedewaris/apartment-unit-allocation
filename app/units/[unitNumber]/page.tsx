import Link from "next/link";
import { notFound } from "next/navigation";
import { UnitWorkspace } from "@/components/units/UnitWorkspace";
import { apartments, assetRegistry, canOpenUnit, findApartment, planRegistry } from "@/lib/data";
import { formatArea, formatPrice } from "@/lib/format";

export function generateStaticParams() {
  return apartments.filter(canOpenUnit).map((unit) => ({ unitNumber: unit.number_num }));
}

export default async function UnitPage({ params }: { params: Promise<{ unitNumber: string }> }) {
  const { unitNumber } = await params;
  const unit = findApartment(unitNumber);
  if (!unit || !canOpenUnit(unit)) notFound();

  const asset = assetRegistry.units[unit.number_num];
  const unitKind = Object.values(unit.function).find(Boolean) || "Apartment";
  const statusLabel = { available: "Available", booked: "Reserved", sold: "Sold", request: "On request" }[unit.status];
  const salesSubject = encodeURIComponent(`Volta SKAI unit ${unit.number}`);
  const salesEmail = `mailto:voltaskai@endover.ee?subject=${salesSubject}`;

  return (
    <div className="unit-page">
      <aside className="unit-details">
        <header className="unit-brandbar">
          <img src="/assets/logo.svg" alt="Volta SKAI" />
          <Link href="/" aria-label="Back to all units">
            <span aria-hidden="true">←</span>
          </Link>
        </header>

        <section className="unit-summary">
          <div className="unit-heading">
            <small>{unit.house.name} · Tallinn</small>
            <h1>{unit.number}</h1>
            <p>{unitKind}</p>
          </div>

          <dl className="unit-facts">
            <div>
              <dt>Tower</dt>
              <dd>{unit.house.identificator}</dd>
            </div>
            <div>
              <dt>Floor</dt>
              <dd>{unit.floor}</dd>
            </div>
            <div>
              <dt>Rooms</dt>
              <dd>{unit.rooms_count || "-"}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{formatArea(unit)}</dd>
            </div>
            <div>
              <dt>{unit.extra_size_type || "Outdoor area"}</dt>
              <dd>{unit.balcony_size_raw ? `${unit.balcony_size_raw} m²` : "-"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd className={`unit-status status-${unit.status}`}>{statusLabel}</dd>
            </div>
          </dl>

          <div className="unit-price">
            <span>Price</span>
            <strong>{formatPrice(unit)}</strong>
          </div>

          <dl className="unit-extras">
            <div>
              <dt>View</dt>
              <dd>{unit.view || "-"}</dd>
            </div>
            <div>
              <dt>Interior finish</dt>
              <dd>SKAI</dd>
            </div>
            <div>
              <dt>Ceiling height</dt>
              <dd>2.9 m</dd>
            </div>
          </dl>

          <nav className="unit-resource-links" aria-label="Unit resources">
            <a href="#unit-stage">
              <span aria-hidden="true">▦</span> Explore floor plan
            </a>
            <a href="#unit-stage">
              <span aria-hidden="true">◇</span> View 3D and interior
            </a>
          </nav>
        </section>
      </aside>

      <UnitWorkspace unit={unit} asset={asset} apartments={apartments} plans={planRegistry} />

      <aside className="sales-panel">
        <section className="reservation-block">
          <small>Your new home</small>
          <h2>
            {unit.booking_url ? "Reserve" : "Ask about"} unit {unit.number}
            <br />
            {unit.booking_url ? "in your name" : "with our sales team"}
          </h2>
          <p>
            {unit.booking_url
              ? "Tell us a few things about yourself, review the price and payment options, and decide from there."
              : "Get the full specification, payment schedule and current availability directly from our sales team."}
          </p>
          <a className="primary-button" href={unit.booking_url || salesEmail}>
            {unit.booking_url ? "Reserve this unit" : "Request information"} <span aria-hidden="true">→</span>
          </a>
        </section>

        <section className="sales-contact">
          <small>Your sales contact</small>
          <div className="contact-card">
            <span className="contact-avatar" aria-hidden="true">
              VS
            </span>
            <div>
              <h3>Volta SKAI Sales</h3>
              <p>Apartment sales team</p>
              <a href={salesEmail}>voltaskai@endover.ee</a>
            </div>
            <a className="contact-action" href={salesEmail} aria-label="Email Volta SKAI Sales">
              ✉
            </a>
          </div>
          <a
            className="share-unit"
            href={`mailto:?subject=${encodeURIComponent(`Volta SKAI unit ${unit.number}`)}&body=${encodeURIComponent(`Take a look at Volta SKAI unit ${unit.number}: /units/${unit.number_num}`)}`}
          >
            Send to a friend
          </a>
        </section>
      </aside>
    </div>
  );
}
