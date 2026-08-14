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

  return (
    <div className="unit-page">
      <aside className="unit-details">
        <header><img src="/assets/logo.svg" alt="Volta SKAI" /><Link href="/" aria-label="Back to all units">←</Link></header>
        <section>
          <small>{unit.house.name}</small>
          <h1><span>Unit details</span>{unit.number}</h1>
          <dl className="unit-facts">
            <div><dt>Tower</dt><dd>{unit.house.identificator}</dd></div>
            <div><dt>Floor</dt><dd>{unit.floor}</dd></div>
            <div><dt>Rooms</dt><dd>{unit.rooms_count || "-"}</dd></div>
            <div><dt>Size</dt><dd>{formatArea(unit)}</dd></div>
            <div><dt>{unit.extra_size_type || "Outdoor area"}</dt><dd>{unit.balcony_size_raw ? `${unit.balcony_size_raw} m²` : "-"}</dd></div>
            <div><dt>Availability</dt><dd className="available">Available</dd></div>
          </dl>
          <div className="unit-price"><span>Price</span><strong>{formatPrice(unit)}</strong></div>
          <dl className="unit-extras"><div><dt>View</dt><dd>{unit.view || "-"}</dd></div><div><dt>Interior finish</dt><dd>SKAI</dd></div><div><dt>Ceiling height</dt><dd>2.9 m</dd></div></dl>
        </section>
      </aside>
      <UnitWorkspace unit={unit} asset={asset} apartments={apartments} plans={planRegistry} />
      <aside className="sales-panel">
        <small>Sales information</small>
        <section><span>Your new home</span><h2>Ask about this unit</h2><p>Get the full specification, payment schedule and availability confirmation from our sales team.</p><a className="primary-button" href={`mailto:voltaskai@endover.ee?subject=Volta SKAI unit ${unit.number}`}>Request information</a>{unit.booking_url && <a className="secondary-button" href={unit.booking_url}>Online reservation</a>}</section>
      </aside>
    </div>
  );
}
