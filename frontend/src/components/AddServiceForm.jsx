import { useState } from "react";
import { addService, updateService } from "../services/api";

function AddServiceForm({ onClose, onSuccess, service = null }) {
  const isEditMode = Boolean(service);
  const [name, setName] = useState(service?.name || "");
  const [url, setUrl] = useState(service?.url || "");
  const [checkInterval, setCheckInterval] = useState(service?.check_interval_seconds || 120);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (isEditMode) {
        await updateService(service.id, {
          name,
          url,
          check_interval_seconds: Number(checkInterval),
        });
        setMessage("Service updated successfully.");
      } else {
        await addService({
          name,
          url,
          check_interval_seconds: Number(checkInterval),
        });
        setMessage("Service added successfully.");
      }

      onSuccess();
    } catch (submitError) {
      setError(
        submitError?.response?.data?.error ||
          `Failed to ${isEditMode ? "update" : "add"} service. Check backend route availability.`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="section-title text-lg font-semibold">
            {isEditMode ? "Edit Service" : "Add Service"}
          </h3>
          <button
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#845763] focus:outline-none"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              type="text"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">URL</label>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#845763] focus:outline-none"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              required
              type="text"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Check Interval (seconds)
            </label>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#845763] focus:outline-none"
              min={10}
              onChange={(event) => setCheckInterval(event.target.value)}
              type="number"
              value={checkInterval}
            />
          </div>

          {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <button
            className="w-full rounded-xl bg-[#92E4BA] px-4 py-2 text-sm font-medium text-[#2B3B33] transition hover:bg-[#90C67F] disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Saving..." : isEditMode ? "Save Changes" : "Add Service"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddServiceForm;
