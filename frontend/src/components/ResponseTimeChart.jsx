import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatTimeLabel(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ResponseTimeChart({ history }) {
  const chartData = [...history]
    .reverse()
    .map((item) => ({
      ...item,
      time: item.checked_at,
      response: item.response_time_ms,
    }));

  return (
    <div className="glass-card rounded-2xl p-4">
      <h3 className="mb-3 text-base font-semibold">Response Time (Last 24 Hours)</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="4 4" stroke="#dbe2ef" />
            <XAxis
              dataKey="time"
              tickFormatter={formatTimeLabel}
              minTickGap={24}
              stroke="#64748b"
            />
            <YAxis stroke="#64748b" unit="ms" />
            <Tooltip
              formatter={(value) => [`${value} ms`, "Response Time"]}
              labelFormatter={(label) => new Date(label).toLocaleString()}
            />
            <Line
              type="monotone"
              dataKey="response"
              stroke="#2563eb"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (cx == null || cy == null) {
                  return null;
                }
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    fill={payload.is_healthy ? "#10b981" : "#ef4444"}
                    r={3}
                    stroke="none"
                  />
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ResponseTimeChart;
