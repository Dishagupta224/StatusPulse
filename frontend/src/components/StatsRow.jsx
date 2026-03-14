function StatItem({ label, value }) {
  return (
    <div className="glass-card rounded-2xl p-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function StatsRow({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatItem label="Uptime 24h" value={`${stats?.uptime_24h ?? 0}%`} />
      <StatItem label="Uptime 7d" value={`${stats?.uptime_7d ?? 0}%`} />
      <StatItem
        label="Avg Response 24h"
        value={`${stats?.avg_response_time_24h ?? 0} ms`}
      />
      <StatItem label="Total Checks" value={stats?.total_checks ?? 0} />
      <StatItem
        label="Min Response 24h"
        value={`${stats?.min_response_time_24h ?? 0} ms`}
      />
      <StatItem
        label="Max Response 24h"
        value={`${stats?.max_response_time_24h ?? 0} ms`}
      />
      <StatItem
        label="Last Checked"
        value={stats?.last_checked_at ? new Date(stats.last_checked_at).toLocaleString() : "-"}
      />
      <StatItem label="Current Status" value={stats?.current_status ?? "down"} />
    </div>
  );
}

export default StatsRow;
