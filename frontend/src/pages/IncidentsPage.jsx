import { useEffect, useMemo, useState } from "react";
import IncidentTable from "../components/IncidentTable";
import StateCard from "../components/StateCard";
import { getIncidents, getServices } from "../services/api";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "ongoing", label: "Ongoing" },
  { key: "resolved", label: "Resolved" },
];

function IncidentsPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [incidents, setIncidents] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [activeFilter]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [incidentsResponse, servicesResponse] = await Promise.all([
        getIncidents(activeFilter === "all" ? undefined : activeFilter),
        getServices(),
      ]);
      setIncidents(incidentsResponse?.data || []);
      setServices(servicesResponse?.data || []);
    } catch (_error) {
      setError("Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }

  const serviceNameById = useMemo(() => {
    return services.reduce((accumulator, service) => {
      accumulator[service.id] = service.name;
      return accumulator;
    }, {});
  }, [services]);

  if (loading) {
    return (
      <StateCard
        description="Loading incident history and service names."
        title="Loading incidents"
      />
    );
  }

  if (error) {
    return (
      <StateCard
        actionLabel="Try again"
        description={error}
        onAction={loadData}
        title="Incidents unavailable"
        tone="error"
      />
    );
  }

  return (
    <section className="space-y-5">
      <div className="glass-card rounded-2xl p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Audit Trail</p>
        <h2 className="section-title mt-1 text-2xl font-semibold">Incidents</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              activeFilter === filter.key
                ? "border-[#92E4BA] bg-[#92E4BA] text-[#2B3B33]"
                : "border-slate-300 bg-white text-slate-700 hover:bg-[#E491A6]/20"
            }`}
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {incidents.length === 0 ? (
        <StateCard
          description="No incidents match the current filter. Your monitored services have stayed healthy so far."
          title="No incidents recorded"
        />
      ) : (
        <IncidentTable incidents={incidents} serviceNameById={serviceNameById} />
      )}
    </section>
  );
}

export default IncidentsPage;
