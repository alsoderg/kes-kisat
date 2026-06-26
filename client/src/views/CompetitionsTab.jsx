import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth.jsx";
import CompetitionDetail from "./CompetitionDetail.jsx";

export default function CompetitionsTab() {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setCompetitions(await api.get("/competitions"));
  }
  useEffect(() => {
    load();
  }, []);

  async function addCompetition(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/competitions", { name, location, startTime: startTime || null });
      setName("");
      setLocation("");
      setStartTime("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (openId) {
    return <CompetitionDetail competitionId={openId} onBack={() => { setOpenId(null); load(); }} />;
  }

  return (
    <div className="card-stack">
      {user.isAdmin && (
        <section className="card">
          <h2>Luo uusi kisa 🛠️</h2>
          <form onSubmit={addCompetition} className="stack-form">
            <input placeholder="Kisan nimi" value={name} onChange={(e) => setName(e.target.value)} />
            <input placeholder="Paikka" value={location} onChange={(e) => setLocation(e.target.value)} />
            <label className="field-label">Alkamisaika
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>
            {error && <p className="error-text">{error}</p>}
            <button className="primary-btn" type="submit">Luo kisa</button>
          </form>
        </section>
      )}

      <section className="card">
        <h2>Kisat 🏁</h2>
        {competitions.length === 0 ? (
          <p className="empty-hint">Ei kisoja vielä.</p>
        ) : (
          <ul className="comp-list">
            {competitions.map((c) => (
              <li key={c.id}>
                <button className="comp-row" onClick={() => setOpenId(c.id)}>
                  <span className="comp-name">
                    {c.is_locked ? "🔒 " : ""}{c.name}
                  </span>
                  <span className="comp-meta">
                    {c.location ? `${c.location} · ` : ""}
                    {c.participant_count} osallistujaa · {c.station_count} rastia
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
