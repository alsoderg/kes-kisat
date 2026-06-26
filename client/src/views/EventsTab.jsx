import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth.jsx";

export default function EventsTab() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [standings, setStandings] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setEvents(await api.get("/event-types"));
  }
  useEffect(() => {
    load();
  }, []);

  async function openEvent(ev) {
    if (openId === ev.id) {
      setOpenId(null);
      return;
    }
    setOpenId(ev.id);
    setStandings(await api.get(`/stats/event-types/${ev.id}/standings`));
  }

  async function addEvent(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/event-types", { name, description, defaultRules: rules });
      setName("");
      setDescription("");
      setRules("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card-stack">
      {user.isAdmin && (
        <section className="card">
          <h2>Lisää laji katalogiin 🛠️</h2>
          <form onSubmit={addEvent} className="stack-form">
            <input placeholder="Lajin nimi" value={name} onChange={(e) => setName(e.target.value)} />
            <input placeholder="Kuvaus" value={description} onChange={(e) => setDescription(e.target.value)} />
            <textarea placeholder="Säännöt (oletus)" value={rules} onChange={(e) => setRules(e.target.value)} rows={3} />
            {error && <p className="error-text">{error}</p>}
            <button className="primary-btn" type="submit">Lisää laji</button>
          </form>
        </section>
      )}

      <section className="card">
        <h2>Lajikatalogi 📍</h2>
        <p className="station-desc">Kaikki lajit ja niiden säännöt. Avaa laji nähdäksesi kaikkien kisojen yhteistuloksen.</p>
        {events.length === 0 ? (
          <p className="empty-hint">Ei lajeja vielä.</p>
        ) : (
          <ul className="comp-list">
            {events.map((ev) => (
              <li key={ev.id}>
                <button className="comp-row" onClick={() => openEvent(ev)}>
                  <span className="comp-name">{ev.name}</span>
                  {ev.description && <span className="comp-meta">{ev.description}</span>}
                </button>
                {openId === ev.id && (
                  <div className="event-detail">
                    {ev.default_rules && (
                      <p className="rules-text"><strong>Säännöt:</strong> {ev.default_rules}</p>
                    )}
                    <h3>Kaikkien kisojen tulokset</h3>
                    {standings.length === 0 ? (
                      <p className="empty-hint">Ei tuloksia vielä.</p>
                    ) : (
                      <table className="score-table">
                        <thead>
                          <tr><th>Pelaaja</th><th>Paras</th><th>Yhteensä</th><th>Yrityksiä</th></tr>
                        </thead>
                        <tbody>
                          {standings.map((row) => (
                            <tr key={row.user_id}>
                              <td>{row.display_name}</td>
                              <td><strong>{row.best}</strong></td>
                              <td>{row.total}</td>
                              <td>{row.attempts}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
