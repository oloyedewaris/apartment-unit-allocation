export interface AboutYouValues {
  fullName: string;
  dateOfBirth: string;
  maritalStatus: string;
  gender: string;
  education: string;
}

interface AboutYouStepProps {
  values: AboutYouValues;
  onChange(values: AboutYouValues): void;
  onBack(): void;
  onContinue(): void;
}

const maritalStatuses = ["Single", "Married", "Separated", "Divorced", "Widowed", "Prefer not to say"];
const genders = ["Female", "Male", "Non-binary", "Prefer to self-describe", "Prefer not to say"];
const educationLevels = [
  "No formal education",
  "Primary education",
  "Secondary education",
  "Diploma or vocational qualification",
  "Bachelor's degree",
  "Master's degree",
  "Doctorate",
  "Other",
  "Prefer not to say",
];

function formatTypedDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join("/");
}

function dateFromDisplay(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function displayFromIso(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function isoFromDisplay(value: string) {
  const date = dateFromDisplay(value);
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function validDateOfBirth(value: string) {
  const date = dateFromDisplay(value);
  if (!date) return false;
  const today = new Date();
  const earliest = new Date(Date.UTC(1900, 0, 1));
  return date >= earliest && date.getTime() <= Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
}

export function AboutYouStep({ values, onChange, onBack, onContinue }: AboutYouStepProps) {
  const update = <Key extends keyof AboutYouValues>(key: Key, value: AboutYouValues[Key]) => onChange({ ...values, [key]: value });
  const complete =
    values.fullName.trim().length >= 2 && validDateOfBirth(values.dateOfBirth) && Boolean(values.maritalStatus && values.gender && values.education);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="reservation-step">
      <header className="reservation-step-header">
        <button type="button" className="reservation-back-link" onClick={onBack}>
          <span aria-hidden="true">←</span> Back
        </button>
        <p>
          Step 5 of 7 <span aria-hidden="true">·</span> About you
        </p>
      </header>

      <div className="reservation-step-scroll about-you-scroll">
        <section className="about-you-intro">
          <h2>Tell us more about yourself</h2>
          <p>This information will appear on the reservation form and sales agreement. Enter your name exactly as it appears on your identification.</p>
        </section>

        <div className="about-you-fields">
          <div className="reservation-field">
            <label htmlFor="reservation-full-name">
              Full name <span aria-hidden="true">*</span>
            </label>
            <input
              id="reservation-full-name"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="As written on your ID"
              value={values.fullName}
              onChange={(event) => update("fullName", event.target.value)}
              required
            />
          </div>

          <div className="reservation-field">
            <label htmlFor="reservation-date-of-birth">
              Date of birth <span aria-hidden="true">*</span>
            </label>
            <div className="date-of-birth-control">
              <input
                id="reservation-date-of-birth"
                name="dateOfBirth"
                type="text"
                inputMode="numeric"
                autoComplete="bday"
                placeholder="DD/MM/YYYY"
                maxLength={10}
                value={values.dateOfBirth}
                onChange={(event) => update("dateOfBirth", formatTypedDate(event.target.value))}
                required
              />
              <span className="calendar-icon" aria-hidden="true" />
              <input
                className="native-date-picker"
                type="date"
                min="1900-01-01"
                max={today}
                value={isoFromDisplay(values.dateOfBirth)}
                onChange={(event) => update("dateOfBirth", displayFromIso(event.target.value))}
                aria-label="Choose date of birth"
              />
            </div>
          </div>

          <div className="reservation-field">
            <label htmlFor="reservation-marital-status">
              Marital status <span aria-hidden="true">*</span>
            </label>
            <select id="reservation-marital-status" value={values.maritalStatus} onChange={(event) => update("maritalStatus", event.target.value)} required>
              <option value="">Select</option>
              {maritalStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="reservation-field">
            <label htmlFor="reservation-gender">
              Gender <span aria-hidden="true">*</span>
            </label>
            <select id="reservation-gender" value={values.gender} onChange={(event) => update("gender", event.target.value)} required>
              <option value="">Select</option>
              {genders.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>
          </div>

          <div className="reservation-field">
            <label htmlFor="reservation-education">
              Highest level of education <span aria-hidden="true">*</span>
            </label>
            <select id="reservation-education" value={values.education} onChange={(event) => update("education", event.target.value)} required>
              <option value="">Select</option>
              {educationLevels.map((education) => (
                <option key={education} value={education}>
                  {education}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <footer className="reservation-step-actions">
        <button type="button" className="secondary-action" onClick={onBack}>
          Back
        </button>
        <button type="button" className="continue-action" disabled={!complete} onClick={onContinue}>
          Continue <span aria-hidden="true">→</span>
        </button>
      </footer>
    </div>
  );
}
