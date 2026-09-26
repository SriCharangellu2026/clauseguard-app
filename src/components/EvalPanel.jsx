export default function EvalPanel({ report }) {
  if (!report) return null
  return (
    <section className="border-t border-line px-4 py-3 text-xs" aria-label="Retrieval evaluation">
      <h2 className="font-semibold">Eval harness</h2>
      <p className="mt-1 text-[var(--muted)]">
        {report.size} labeled clauses · section accuracy {(report.sectionAccuracy * 100).toFixed(0)}%
      </p>
      <ul className="mt-2 space-y-1">
        {Object.entries(report.bySeverity || {}).map(([label, row]) => (
          <li key={label}>
            {label}: P {row.precision.toFixed(2)} / R {row.recall.toFixed(2)} (n={row.support})
          </li>
        ))}
      </ul>
    </section>
  )
}
