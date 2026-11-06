const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC', // DATE has no timezone; avoid off-by-one-day shifts
});

const initials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const hueFor = (text) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

export default function EmployeeCard({ employee }) {
  const { name, email, department, designation, date_of_joining: joined } = employee;
  const hue = hueFor(department);
  return (
    <article className="card" style={{ '--hue': hue }}>
      <div className="card__avatar" aria-hidden="true">{initials(name)}</div>
      <div className="card__body">
        <h3 className="card__name">{name}</h3>
        <p className="card__title">{designation}</p>
        <span className="badge">{department}</span>
        <p className="card__meta">
          <a href={`mailto:${email}`}>{email}</a>
        </p>
        <p className="card__meta">Joined {dateFormat.format(new Date(joined))}</p>
      </div>
    </article>
  );
}
