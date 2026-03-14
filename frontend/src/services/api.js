import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  timeout: 10000,
});

export async function getServices() {
  const response = await api.get("/api/services");
  return response.data;
}

export async function getService(id) {
  const response = await api.get(`/api/services/${id}`);
  return response.data;
}

export async function getServiceStats(id) {
  const response = await api.get(`/api/services/${id}/stats`);
  return response.data;
}

export async function getServiceHistory(id, limit = 100) {
  const response = await api.get(`/api/services/${id}/history`, {
    params: { limit },
  });
  return response.data;
}

export async function getServiceIncidents(id) {
  const response = await api.get(`/api/services/${id}/incidents`);
  return response.data;
}

export async function addService(data) {
  const response = await api.post("/api/services", data);
  return response.data;
}

export async function updateService(id, data) {
  const response = await api.put(`/api/services/${id}`, data);
  return response.data;
}

export async function deleteService(id) {
  const response = await api.delete(`/api/services/${id}`);
  return response.data;
}

export async function runServiceCheck(id) {
  const response = await api.post(`/api/services/${id}/check`);
  return response.data;
}

export async function getIncidents(status) {
  const response = await api.get("/api/incidents", {
    params: status ? { status } : {},
  });
  return response.data;
}

export default api;
