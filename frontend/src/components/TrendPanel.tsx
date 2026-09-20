import type { StatsResponse } from '../api/client';

interface Props {
  stats: StatsResponse | null;
  loading?: boolean;
}

interface CategoryProps {
  title: string;
  data?: Record<string, number>;
  total: number;
  maxItems?: number;
}

function TrendCategory({ title, data, total, maxItems = 5 }: CategoryProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="trend-category">
        <div className="trend-category-title">{title}</div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-dim)' }}>No data available</p>
      </div>
    );
  }

  // Sort items by count descending
  const sorted = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxItems);

  // Highest count in this category for relative bar sizing
  const maxCategoryCount = sorted[0]?.[1] || 1;

  return (
    <div className="trend-category">
      <div className="trend-category-title">
        <span>{title}</span>
        <span>{Object.keys(data).length} total</span>
      </div>

      {sorted.map(([key, count]) => {
        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
        const barWidth = `${Math.min(100, Math.max(8, (count / maxCategoryCount) * 100))}%`;

        // Format label for active boolean if needed
        let label = key;
        if (key === '1' || key === 'true') label = 'Active';
        if (key === '0' || key === 'false') label = 'Inactive';

        return (
          <div className="trend-item" key={key}>
            <div className="trend-item-header">
              <span className="trend-item-label">{label}</span>
              <span className="trend-item-count">
                {count.toLocaleString()} ({percentage}%)
              </span>
            </div>
            <div className="trend-bar-bg">
              <div className="trend-bar-fill" style={{ width: barWidth }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TrendPanel({ stats, loading }: Props) {
  const totalPopulation = stats?._total?.count ?? 0;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Population Trends</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Aggregated distribution computed over the entire database population ({totalPopulation.toLocaleString()} people)
          </span>
        </div>
        {loading && <div className="loading-spinner" title="Refreshing trends..." />}
      </div>

      <div className="card-body">
        <div className="trends-grid">
          <TrendCategory
            title="Department Distribution"
            data={stats?.department}
            total={totalPopulation}
          />
          <TrendCategory
            title="Country Distribution"
            data={stats?.country}
            total={totalPopulation}
          />
          <TrendCategory
            title="Top Roles"
            data={stats?.role}
            total={totalPopulation}
          />
          <TrendCategory
            title="Employment Status"
            data={stats?.active}
            total={totalPopulation}
          />
        </div>
      </div>
    </div>
  );
}
