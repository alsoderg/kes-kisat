import { useEffect, useState } from "react";
import "./App.css";
import { useAuth } from "./auth.jsx";
import AuthView from "./views/AuthView.jsx";
import CompetitionsTab from "./views/CompetitionsTab.jsx";
import EventsTab from "./views/EventsTab.jsx";
import ResultsTab from "./views/ResultsTab.jsx";
import ProfileView from "./views/ProfileView.jsx";
import AdminPanel from "./views/AdminPanel.jsx";

export default function App() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState("competitions");

  // Sovella käyttäjän teema <html data-theme>:iin
  useEffect(() => {
    document.documentElement.dataset.theme = user?.theme || "kesa";
  }, [user]);

  if (loading) {
    return <div className="app loading">Ladataan…</div>;
  }

  if (!user) {
    return <AuthView />;
  }

  const tabs = [
    { id: "competitions", label: "🏁 Kisat" },
    { id: "events", label: "📍 Rastit" },
    { id: "results", label: "📊 Tulokset" },
    { id: "profile", label: "👤 Profiili" },
  ];
  if (user.isAdmin) tabs.push({ id: "admin", label: "🛠️ Admin" });

  return (
    <div className="app">
      <header className="app-header">
        <h1>☀️ Allun Kesäkisat 🏆</h1>
        <div className="user-chip">
          <span>{user.displayName}{user.isAdmin ? " · admin" : ""}</span>
          <button className="link-btn" onClick={logout}>Kirjaudu ulos</button>
        </div>
      </header>

      <nav className="tabs">
        {tabs.map((t) => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="tab-content">
        {tab === "competitions" && <CompetitionsTab />}
        {tab === "events" && <EventsTab />}
        {tab === "results" && <ResultsTab />}
        {tab === "profile" && <ProfileView />}
        {tab === "admin" && user.isAdmin && <AdminPanel />}
      </main>
    </div>
  );
}
