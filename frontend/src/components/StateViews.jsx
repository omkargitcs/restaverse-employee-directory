import { useEffect, useState } from "react";

export function SkeletonList({ count = 6 }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(id);
  }, []);

  return (
    <>
      {slow && (
        <p className="hint" role="status">
          Waking up the server… the first load can take up to a minute.
        </p>
      )}
      <ul className="grid" aria-label="Loading employees" aria-busy="true">
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className="card card--skeleton">
            <div className="skeleton skeleton--avatar" />
            <div className="card__body">
              <div
                className="skeleton skeleton--line"
                style={{ width: "60%" }}
              />
              <div
                className="skeleton skeleton--line"
                style={{ width: "80%" }}
              />
              <div
                className="skeleton skeleton--line"
                style={{ width: "40%" }}
              />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

export function EmptyState({ query }) {
  return (
    <div className="state" role="status">
      <div className="state__icon" aria-hidden="true">
        🔍
      </div>
      <h2>No employees found</h2>
      <p>
        {query ? (
          <>
            Nothing matches <strong>“{query}”</strong>. Try a different name or
            department.
          </>
        ) : (
          "The directory is empty."
        )}
      </p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <div className="state__icon" aria-hidden="true">
        ⚠️
      </div>
      <h2>Couldn’t load employees</h2>
      <p>{message}</p>
      <button type="button" className="btn" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
