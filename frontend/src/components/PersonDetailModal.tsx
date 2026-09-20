import type { Person } from '../api/client';

interface Props {
  person: Person | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export default function PersonDetailModal({ person, onClose, onDelete }: Props) {
  if (!person) return null;

  const formattedSalary = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(person.salary);

  const formattedJoinedAt = new Date(person.joinedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="card-title">{person.name}</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {person.role} • {person.department}
            </span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item detail-item-full">
              <span className="detail-label">Person ID</span>
              <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.825rem' }}>
                {person.id}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Country</span>
              <span className="detail-value">{person.country}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Department</span>
              <span className="detail-value">{person.department}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Role</span>
              <span className="detail-value">{person.role}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className="detail-value">
                <span className={`badge ${person.active ? 'badge-active' : 'badge-inactive'}`}>
                  {person.active ? '● Active' : '○ Inactive'}
                </span>
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Age</span>
              <span className="detail-value">{person.age} years</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Salary (USD)</span>
              <span className="detail-value" style={{ color: '#047857', fontWeight: 600 }}>
                {formattedSalary}
              </span>
            </div>

            <div className="detail-item detail-item-full">
              <span className="detail-label">Joined Date</span>
              <span className="detail-value">{formattedJoinedAt}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete ${person.name}?`)) {
                onDelete(person.id);
                onClose();
              }
            }}
          >
            Delete Person
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

