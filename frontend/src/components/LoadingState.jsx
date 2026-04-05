function SkeletonRows({ columns, rows }) {
  return Array.from({ length: rows }, (_, rowIndex) => (
    <tr key={`skeleton-row-${rowIndex}`}>
      {Array.from({ length: columns }, (_, columnIndex) => (
        <td key={`skeleton-cell-${rowIndex}-${columnIndex}`}>
          <div className={`skeleton-line ${columnIndex === columns - 1 ? 'short' : ''}`} />
        </td>
      ))}
    </tr>
  ));
}

export function FullPageLoader({ label = 'Loading...' }) {
  return (
    <div className="loader-shell" role="status" aria-live="polite">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="page-shell" aria-hidden="true">
      <div className="page-title">
        <div className="skeleton-pill" />
        <div className="skeleton-line title" />
        <div className="skeleton-line wide" />
      </div>

      <div className="metrics-grid">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="card metric-card" key={`metric-skeleton-${index}`}>
            <div className="skeleton-line short" />
            <div className="skeleton-line medium" />
            <div className="skeleton-pill subtle" />
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="panel chart-panel span-7">
          <div className="skeleton-line medium" />
          <div className="skeleton-chart" />
        </div>
        <div className="panel chart-panel span-5">
          <div className="skeleton-line medium" />
          <div className="skeleton-chart circle" />
        </div>
        <div className="panel table-shell span-12">
          <div style={{ padding: '1.25rem 1.25rem 0' }}>
            <div className="skeleton-line medium" />
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <SkeletonRows columns={4} rows={4} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ columns, rows = 5 }) {
  return <SkeletonRows columns={columns} rows={rows} />;
}
