import { NavLink, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import IncidentsPage from "./pages/IncidentsPage";

function App() {
  return (
    <div className="relative min-h-screen overflow-hidden text-slate-800">
      <header
        className="sticky top-0 z-20 border-b backdrop-blur-xl"
        style={{ borderColor: "rgba(132,87,99,0.35)", backgroundColor: "#845763" }}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-rose-100/90">
              Ops Console
            </p>
            <h1 className="section-title text-lg font-semibold text-white">
              StatusPulse
            </h1>
          </div>

          <nav className="flex items-center gap-2 rounded-full border border-rose-100/30 bg-white/10 p-1 text-sm font-medium shadow-sm">
            <NavLink
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 transition ${
                  isActive
                    ? "bg-[#92E4BA] text-[#2B3B33]"
                    : "text-white/90 hover:bg-white/15"
                }`
              }
              to="/"
            >
              Dashboard
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 transition ${
                  isActive
                    ? "bg-[#92E4BA] text-[#2B3B33]"
                    : "text-white/90 hover:bg-white/15"
                }`
              }
              to="/incidents"
            >
              Incidents
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/services/:id" element={<ServiceDetailPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
