import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";

function ServiceCard({
  service,
  onEdit,
  onDelete,
  onCheckNow,
  deleting = false,
  checking = false,
}) {
  return (
    <div className="glass-card float-in group rounded-2xl p-4 transition hover:-translate-y-1 hover:shadow-xl">
      <Link className="block" to={`/services/${service.id}`}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold tracking-tight">{service.name}</h3>
          <StatusBadge status={service.current_status} />
        </div>

        <p className="mt-2 truncate rounded bg-slate-100/70 px-2 py-1 text-xs text-slate-600">
          {service.url}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Last Response</p>
            <p className="mt-1 text-lg font-semibold">
              {service.last_response_time_ms ?? "-"}
              {service.last_response_time_ms != null ? " ms" : ""}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Uptime (24h)</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {service.uptime_24h ?? "0"}%
            </p>
          </div>
        </div>
      </Link>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded-full border border-[#92E4BA]/55 bg-[#92E4BA]/20 px-3 py-1.5 text-xs font-medium text-[#2B3B33] transition hover:bg-[#92E4BA]/35 disabled:opacity-60"
          disabled={checking}
          onClick={() => onCheckNow(service)}
          type="button"
        >
          {checking ? "Checking..." : "Check Now"}
        </button>
        <button
          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          onClick={() => onEdit(service)}
          type="button"
        >
          Edit
        </button>
        <button
          className="rounded-full border border-[#E491A6]/50 bg-[#E491A6]/15 px-3 py-1.5 text-xs font-medium text-[#6E3D4D] transition hover:bg-[#E491A6]/25 disabled:opacity-60"
          disabled={deleting}
          onClick={() => onDelete(service)}
          type="button"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}

export default ServiceCard;
