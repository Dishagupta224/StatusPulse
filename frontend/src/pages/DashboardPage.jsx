import { useCallback, useEffect, useState } from "react";
import AddServiceForm from "../components/AddServiceForm";
import ServiceCard from "../components/ServiceCard";
import StateCard from "../components/StateCard";
import {
  deleteService,
  getServiceHistory,
  getServices,
  runServiceCheck,
} from "../services/api";

function DashboardPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deletingServiceId, setDeletingServiceId] = useState(null);
  const [checkingServiceId, setCheckingServiceId] = useState(null);
  const [banner, setBanner] = useState(null);

  const loadServices = useCallback(async () => {
    try {
      setError("");
      const listResponse = await getServices();
      const baseServices = listResponse?.data || [];

      // Fetch latest ping per service to display "last response time" on cards.
      const enriched = await Promise.all(
        baseServices.map(async (service) => {
          try {
            const historyResponse = await getServiceHistory(service.id, 1);
            const latest = historyResponse?.data?.[0] || null;
            return {
              ...service,
              last_response_time_ms: latest?.response_time_ms ?? null,
            };
          } catch (_error) {
            return {
              ...service,
              last_response_time_ms: null,
            };
          }
        })
      );

      setServices(enriched);
    } catch (_error) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();

    const interval = setInterval(() => {
      loadServices();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadServices]);

  useEffect(() => {
    if (!banner) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setBanner(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [banner]);

  async function handleDelete(service) {
    const confirmed = window.confirm(
      `Delete "${service.name}"? This will remove the service from monitoring.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingServiceId(service.id);
      setError("");
      setBanner(null);
      await deleteService(service.id);
      await loadServices();
    } catch (_error) {
      setError("Failed to delete service");
    } finally {
      setDeletingServiceId(null);
    }
  }

  async function handleCheckNow(service) {
    try {
      setCheckingServiceId(service.id);
      setError("");
      setBanner(null);
      const response = await runServiceCheck(service.id);
      const result = response?.data;

      if (result?.isHealthy) {
        setBanner({
          tone: "success",
          message: `${service.name} is UP (${result.responseTimeMs} ms).`,
        });
      } else {
        setBanner({
          tone: "error",
          message: `${service.name} is DOWN${result?.errorMessage ? ` (${result.errorMessage})` : ""}.`,
        });
      }

      await loadServices();
    } catch (_error) {
      setError(`Failed to run manual check for ${service.name}`);
    } finally {
      setCheckingServiceId(null);
    }
  }

  if (loading) {
    return (
      <StateCard
        description="Fetching services, latest response times, and uptime metrics."
        title="Loading dashboard"
      />
    );
  }

  if (error) {
    return (
      <StateCard
        actionLabel="Try again"
        description={error}
        onAction={loadServices}
        title="Dashboard unavailable"
        tone="error"
      />
    );
  }

  return (
    <section className="space-y-5">
      <div className="glass-card rounded-2xl p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Live Monitoring
            </p>
            <h2 className="section-title text-2xl font-semibold">Services</h2>
          </div>
          <button
            className="rounded-full bg-[#92E4BA] px-4 py-2 text-sm font-medium text-[#2B3B33] transition hover:bg-[#90C67F]"
            onClick={() => {
              setEditingService(null);
              setShowModal(true);
            }}
          >
            Add Service
          </button>
        </div>

        <p className="text-sm text-slate-600">
          Auto-refresh is enabled every 30 seconds.
        </p>
      </div>

      {banner ? (
        <div
          className={`glass-card rounded-2xl border px-4 py-3 text-sm ${
            banner.tone === "success"
              ? "border-[#92E4BA]/50 bg-[#F3FFF8] text-[#2B3B33]"
              : "border-[#E491A6]/45 bg-[#FFF7F9] text-[#6E3D4D]"
          }`}
        >
          {banner.message}
        </div>
      ) : null}

      {services.length === 0 ? (
        <StateCard
          actionLabel="Add your first service"
          description="Once a service is added, the dashboard will start tracking uptime and response times automatically."
          onAction={() => {
            setEditingService(null);
            setShowModal(true);
          }}
          title="No monitored services yet"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              checking={checkingServiceId === service.id}
              deleting={deletingServiceId === service.id}
              key={service.id}
              onCheckNow={handleCheckNow}
              onDelete={handleDelete}
              onEdit={(selectedService) => {
                setEditingService(selectedService);
                setShowModal(true);
              }}
              service={service}
            />
          ))}
        </div>
      )}

      {showModal ? (
        <AddServiceForm
          onClose={() => {
            setEditingService(null);
            setShowModal(false);
          }}
          onSuccess={() => {
            setEditingService(null);
            setShowModal(false);
            loadServices();
          }}
          service={editingService}
        />
      ) : null}
    </section>
  );
}

export default DashboardPage;
