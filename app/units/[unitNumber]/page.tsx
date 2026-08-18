import Link from "next/link";
import { notFound } from "next/navigation";
import { UnitWorkspace } from "@/components/units/UnitWorkspace";
import { apartments, assetRegistry, canOpenUnit, findApartment, planRegistry } from "@/lib/data";
import { formatArea, formatPrice } from "@/lib/format";

export function generateStaticParams() {
  return apartments.filter(canOpenUnit).map((unit) => ({ unitNumber: unit.number_num }));
}

const salesData = [
  {
    name: "Diana Uibo",
    role: "Customer Relations Manager",
    tel: "+372 5944 4444",
    whatsappLink: "https://wa.me/3725944444?text=Hello%20Diana%2C%20I%20am%20interested%20in%20unit%2061%20at%20Krulli%2010.",
    email: "diana@krulli10.ee",
  },
  {
    name: "Martin Kask",
    role: "Sales Manager",
    tel: "+372 5944 4555",
    whatsappLink: "https://wa.me/3725944555?text=Hello%20Martin%2C%20I%20am%20interested%20in%20unit%2061%20at%20Krulli%2010.",
    email: "martinkask@krulli10.ee",
  },
];

export default async function UnitPage({ params }: { params: Promise<{ unitNumber: string }> }) {
  const { unitNumber } = await params;
  const unit = findApartment(unitNumber);
  if (!unit || !canOpenUnit(unit)) notFound();

  const asset = assetRegistry.units[unit.number_num];
  const unitKind = Object.values(unit.function).find(Boolean) || "Apartment";
  const statusLabel = { available: "Available", booked: "Reserved", sold: "Sold", request: "On request" }[unit.status];
  const salesSubject = encodeURIComponent(`Volta SKAI unit ${unit.number}`);
  const salesEmail = `mailto:voltaskai@endover.ee?subject=${salesSubject}`;
  const floor = Number(unit.min_floor || unit.floor);
  const tower = unit.house.identificator;
  const planApartments = apartments.filter((apartment) => Number(apartment.min_floor || apartment.floor) === floor && apartment.house.identificator === tower);
  const sourceFloor = floor >= 6 && floor <= 9 ? 6 : floor;
  const unitPlans = {
    [String(floor)]: { [tower]: planRegistry[String(floor)]?.[tower] },
    ...(sourceFloor === floor ? {} : { [String(sourceFloor)]: { [tower]: planRegistry[String(sourceFloor)]?.[tower] } }),
  };

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

      <UnitWorkspace unit={unit} asset={asset} apartments={planApartments} plans={unitPlans} />

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
          {salesData.map((sale) => (
            <div key={sale.name} className="contact-card">
              <span className="contact-avatar" aria-hidden="true">
                {sale.name.split(" ")?.[0]?.[0]}
                {sale.name.split(" ")?.[1]?.[0]}
              </span>
              <div className="contact-details">
                <h3>{sale.name}</h3>
                <p>{sale.role}</p>
                <a href={`mailto:${sale.email}?subject=${salesSubject}`}>{sale.email}</a>
              </div>
              <div className="contact-actions">
                <a
                  className="contact-action"
                  href={sale.whatsappLink.replace(/unit%2061/i, `unit%20${encodeURIComponent(unit.number)}`)}
                  aria-label={`Message ${sale.name} on WhatsApp`}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12.04 2C6.6 2 2.18 6.42 2.18 11.86c0 1.74.46 3.44 1.32 4.94L2 22l5.35-1.4a9.82 9.82 0 0 0 4.69 1.19c5.43 0 9.85-4.42 9.85-9.86A9.79 9.79 0 0 0 12.04 2zm0 17.94a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.1.81.83-3.02-.2-.31a8.13 8.13 0 0 1-1.25-4.34c0-4.52 3.68-8.2 8.2-8.2a8.15 8.15 0 0 1 8.19 8.2c0 4.52-3.68 8.18-8.19 8.18z"></path>
                    <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.71 2-1.4.25-.69.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35z"></path>
                  </svg>
                </a>
                <a className="contact-action" href={`mailto:${sale.email}?subject=${salesSubject}`} aria-label="Email Volta SKAI Sales">
                  ✉
                </a>
              </div>
            </div>
          ))}
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
