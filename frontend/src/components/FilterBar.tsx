import type { FilterOptions } from '../api/client';

interface Props {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  departments?: string[];
  countries?: string[];
}

const DEFAULT_DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Sales',
  'Marketing',
  'Finance',
  'Human Resources',
  'Operations',
];

const DEFAULT_COUNTRIES = [
  'United States',
  'United Kingdom',
  'Germany',
  'Canada',
  'France',
  'Australia',
  'Japan',
  'India',
  'Netherlands',
  'Singapore',
  'Spain',
  'Brazil',
  'Sweden',
  'Switzerland',
  'Ireland',
];

export default function FilterBar({
  filters,
  onChange,
  departments = DEFAULT_DEPARTMENTS,
  countries = DEFAULT_COUNTRIES,
}: Props) {
  const activeCount = Object.values(filters).filter((v) => v !== undefined && v !== '').length;

  const handleSelect = (key: keyof FilterOptions, value: string) => {
    onChange({
      ...filters,
      [key]: value === '' ? undefined : value,
    });
  };

  const handleClear = () => {
    onChange({});
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.875rem 1.25rem',
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1rem',
      }}
    >
      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
        🔍 Database Filters:
      </span>

      {/* Department Filter */}
      <select
        value={filters.department || ''}
        onChange={(e) => handleSelect('department', e.target.value)}
        style={{
          padding: '0.35rem 0.65rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          fontSize: '0.8125rem',
          backgroundColor: filters.department ? 'var(--primary-light)' : '#ffffff',
          color: filters.department ? 'var(--primary)' : 'var(--text-main)',
          fontWeight: filters.department ? 600 : 400,
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        <option value="">All Departments</option>
        {departments.map((dept) => (
          <option key={dept} value={dept}>
            {dept}
          </option>
        ))}
      </select>

      {/* Country Filter */}
      <select
        value={filters.country || ''}
        onChange={(e) => handleSelect('country', e.target.value)}
        style={{
          padding: '0.35rem 0.65rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          fontSize: '0.8125rem',
          backgroundColor: filters.country ? 'var(--primary-light)' : '#ffffff',
          color: filters.country ? 'var(--primary)' : 'var(--text-main)',
          fontWeight: filters.country ? 600 : 400,
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        <option value="">All Countries</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* Active / Status Filter */}
      <select
        value={filters.active === undefined ? '' : String(filters.active)}
        onChange={(e) => handleSelect('active', e.target.value)}
        style={{
          padding: '0.35rem 0.65rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)',
          fontSize: '0.8125rem',
          backgroundColor: filters.active !== undefined ? 'var(--primary-light)' : '#ffffff',
          color: filters.active !== undefined ? 'var(--primary)' : 'var(--text-main)',
          fontWeight: filters.active !== undefined ? 600 : 400,
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        <option value="">All Statuses</option>
        <option value="true">Active only</option>
        <option value="false">Inactive only</option>
      </select>

      {/* Clear Button if active */}
      {activeCount > 0 && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleClear}
          style={{ marginLeft: 'auto', fontSize: '0.75rem' }}
        >
          Clear Filters ({activeCount})
        </button>
      )}
    </div>
  );
}

