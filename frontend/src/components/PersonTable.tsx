import type { Person } from '../api/client';

interface Props {
  people: Person[];
  onDelete: (id: string) => void;
  onSelectPerson?: (person: Person) => void;
}

export default function PersonTable({ people, onDelete, onSelectPerson }: Props) {
  if (people.length === 0) {
    return (
      <div className="empty-state">
        <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No people found</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
          No records match the current criteria or population has not been generated yet.
        </p>
      </div>
    );
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Department</th>
            <th>Country</th>
            <th>Age</th>
            <th>Salary</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.id} onClick={() => onSelectPerson?.(p)}>
              <td style={{ fontWeight: 600 }}>{p.name}</td>
              <td>{p.role}</td>
              <td>
                <span className="badge badge-neutral">{p.department}</span>
              </td>
              <td>{p.country}</td>
              <td>{p.age}</td>
              <td style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(p.salary)}</td>
              <td>
                <span className={`badge ${p.active ? 'badge-active' : 'badge-inactive'}`}>
                  {p.active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectPerson?.(p)}
                    title="View full details"
                  >
                    Details
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      if (window.confirm(`Delete ${p.name}?`)) {
                        onDelete(p.id);
                      }
                    }}
                    title="Delete person"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
