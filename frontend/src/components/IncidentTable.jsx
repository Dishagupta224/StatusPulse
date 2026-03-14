function IncidentTable({ incidents, serviceNameById = {} }) {
  return (
    <div className="glass-card overflow-x-auto rounded-2xl">
      <table className="min-w-full divide-y divide-slate-200/80 text-sm">
        <thead className="bg-slate-100/80 text-left">
          <tr>
            <th className="px-4 py-2 font-medium">Service</th>
            <th className="px-4 py-2 font-medium">Started At</th>
            <th className="px-4 py-2 font-medium">Resolved At</th>
            <th className="px-4 py-2 font-medium">Duration</th>
            <th className="px-4 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/80">
          {incidents.map((incident) => (
            <tr key={incident.id}>
              <td className="px-4 py-2">
                {serviceNameById[incident.service_id] || `Service #${incident.service_id}`}
              </td>
              <td className="px-4 py-2">
                {incident.started_at ? new Date(incident.started_at).toLocaleString() : "-"}
              </td>
              <td className="px-4 py-2">
                {incident.resolved_at ? new Date(incident.resolved_at).toLocaleString() : "-"}
              </td>
              <td className="px-4 py-2">
                {incident.duration_minutes != null
                  ? `${incident.duration_minutes} min`
                  : "-"}
              </td>
              <td className="px-4 py-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    incident.status === "ongoing"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {incident.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default IncidentTable;
