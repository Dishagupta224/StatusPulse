import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import IncidentTable from "../components/IncidentTable";
import PingHistoryTable from "../components/PingHistoryTable";
import ResponseTimeChart from "../components/ResponseTimeChart";
import StateCard from "../components/StateCard";
import StatsRow from "../components/StatsRow";
import StatusBadge from "../components/StatusBadge";
import {
  getServiceHistory,
  getServiceIncidents,
  getServices,
  getServiceStats,
} from "../services/api";

function ServiceDetailPage() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setError("");
    try {
      const [servicesResponse, statsResponse, historyResponse, incidentsResponse] =
        await Promise.all([
          getServices(),
          getServiceStats(id),
          getServiceHistory(id, 100),
          getServiceIncidents(id),
        ]);

      const serviceList = servicesResponse?.data || [];
      const currentService = serviceList.find((item) => String(item.id) === String(id));

      setService(currentService || null);
      setStats(statsResponse?.data || null);
      setHistory(historyResponse?.data || []);
      setIncidents(incidentsResponse?.data || []);
    } catch (_error) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <StateCard
        description="Loading service details, recent ping history, and incident records."
        title="Loading service detail"
      />
    );
  }

  if (error) {
    return (
      <StateCard
        actionLabel="Try again"
        description={error}
        onAction={loadData}
        title="Service detail unavailable"
        tone="error"
      />
    );
  }

  return (
    <section className="space-y-5">
      <div className="glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            Service Detail
          </p>
          <h2 className="section-title text-2xl font-semibold">
            {service?.name || `Service #${id}`}
          </h2>
          <p className="text-sm text-slate-500">{service?.url || "URL unavailable"}</p>
        </div>
        <StatusBadge large status={stats?.current_status || service?.current_status || "down"} />
      </div>

      <StatsRow stats={stats || {}} />

      {history.length === 0 ? (
        <StateCard
          description="Ping results will appear here after the first successful scheduled or manual health check."
          title="No ping history yet"
        />
      ) : (
        <ResponseTimeChart history={history} />
      )}

      <div>
        <h3 className="mb-2 text-base font-semibold">Last 20 Ping Results</h3>
        {history.length === 0 ? (
          <StateCard
            description="This service has not recorded any health checks yet."
            title="No recent ping results"
          />
        ) : (
          <PingHistoryTable rows={history.slice(0, 20)} />
        )}
      </div>

      <div>
        <h3 className="mb-2 text-base font-semibold">Incident History</h3>
        {incidents.length === 0 ? (
          <StateCard
            description="Incidents will show up here after three consecutive failed health checks."
            title="No incidents for this service"
          />
        ) : (
          <IncidentTable incidents={incidents} />
        )}
      </div>

      <Link
        className="inline-block rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        to="/"
      >
        Back to Dashboard
      </Link>
    </section>
  );
}

export default ServiceDetailPage;
