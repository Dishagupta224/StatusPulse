function PingHistoryTable({ rows }) {
  return (
    <div className="glass-card overflow-x-auto rounded-2xl">
      <table className="min-w-full divide-y divide-slate-200/80 text-sm">
        <thead className="bg-slate-100/80 text-left">
          <tr>
            <th className="px-4 py-2 font-medium">Checked At</th>
            <th className="px-4 py-2 font-medium">Status Code</th>
            <th className="px-4 py-2 font-medium">Response Time</th>
            <th className="px-4 py-2 font-medium">Health</th>
            <th className="px-4 py-2 font-medium">Error</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/80">
          {rows.map((row, index) => (
            <tr key={`${row.checked_at}-${index}`}>
              <td className="px-4 py-2">{new Date(row.checked_at).toLocaleString()}</td>
              <td className="px-4 py-2">{row.status_code ?? "-"}</td>
              <td className="px-4 py-2">{row.response_time_ms} ms</td>
              <td className="px-4 py-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    row.is_healthy
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {row.is_healthy ? "Healthy" : "Unhealthy"}
                </span>
              </td>
              <td className="px-4 py-2">{row.error_message ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PingHistoryTable;
