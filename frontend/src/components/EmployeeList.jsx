import EmployeeCard from './EmployeeCard.jsx';

export default function EmployeeList({ employees, isRefreshing = false }) {
  return (
    <ul className={`grid${isRefreshing ? ' grid--refreshing' : ''}`} aria-busy={isRefreshing}>
      {employees.map((e) => (
        <li key={e.id}>
          <EmployeeCard employee={e} />
        </li>
      ))}
    </ul>
  );
}
