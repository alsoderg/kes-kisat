import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth.jsx";
import StationCard from "./StationCard.jsx";

export default function CompetitionDetail({ competitionId, onBack }) {
  const { user } = useAuth();
  const [comp, setComp] = useState(null);
  const [stations, setStations] = useState([]);
  const [standings, setStandings] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [newStationEvent, setNewStationEvent] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [c, s, st] = await Promise.all([
      api.get(`/competitions/${competitionId}`),
      api.get(`/competitions/${competitionId}/stations`),
      api.get(`/stats/competitions/${competitionId}/standings`),
    ]);
    setComp(c);
    setStations(s);
    setStandings(st);
  }, [competitionId]);

  useEffect(() => {
    load();
    if (user.isAdmin) api.get("/event-types").then(setEventTypes);
  }, [load, user.isAdmin]);

  if (!comp) return <p className="empty-hint">Ladataan…</p>;

  const isParticipant = comp.participants.some((p) => p.id === user.id);
  const locked = comp.is_locked;

  async function toggleJoin() {
    if (isParticipant) await api.del(`/competitions/${competitionId}/join`);
    else await api.post(`/competitions/${competitionId}/join`);
    load();
  }

  async function toggleLock() {
    await api.patch(`/competitions/${competitionId}`, { isLocked: !locked });
    load();
  }

  async function addStation(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/competitions/${competitionId}/stations`, {
        eventTypeId: Number(newStationEvent),
        position: stations.length,
      });
      setNewStationEvent("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function shareStandings() {
    try {
      await api.post(`/admin/discord/competition/${competitionId}/standings`);
      alert("Tilanne jaettu Discordiin!");
    } catch (err) {
      alert(err.message);
    }
  }

  async function announceStart() {
    try {
      await api.post(`/admin/discord/start-time/${competitionId}`);
      alert("Alkamisaika ilmoitettu Discordiin!");
    } catch (err) {
      alert(err.message);
    }
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="card-stack">
      <button className="link-btn back-btn" onClick={onBack}>← Takaisin kisoihin</button>

      <section className="card">
        <div className="station-header">
          <h2>{locked ? "🔒 " : ""}{comp.name}</h2>
          {!locked && (
            <button className="share-btn" onClick={toggleJoin}>
              {isParticipant ? "Poistu kisasta" : "Liity kisaan"}
            </button>
          )}
        </div>
        {comp.location && <p className="station-desc">📍 {comp.location}</p>}
        {comp.start_time && (
          <p className="station-desc">⏰ {new Date(comp.start_time).toLocaleString("fi-FI")}</p>
        )}
        <p className="player-count">{comp.participants.length} osallistujaa</p>

        {user.isAdmin && (
          <div className="admin-actions">
            <button className="share-btn" onClick={toggleLock}>
              {locked ? "🔓 Avaa lukitus" : "🔒 Lukitse kisa"}
            </button>
            <button className="share-btn" onClick={shareStandings}>📣 Jaa tilanne Discordiin</button>
            {comp.start_time && (
              <button className="share-btn" onClick={announceStart}>🎉 Ilmoita alkamisaika</button>
            )}
          </div>
        )}
      </section>

      {/* Kisakohtainen tilanne */}
      <section className="card">
        <h2>Kisan tilanne 🏆</h2>
        {standings.length === 0 ? (
          <p className="empty-hint">Ei tuloksia vielä.</p>
        ) : (
          <table className="score-table">
            <thead>
              <tr><th>Sija</th><th>Pelaaja</th><th>Pisteet</th><th>Tyyli ✨</th><th>Yhteensä</th></tr>
            </thead>
            <tbody>
              {standings.map((row, i) => (
                <tr key={row.user_id} className={i === 0 ? "leader" : ""}>
                  <td>{medals[i] ?? i + 1}</td>
                  <td>{row.display_name}</td>
                  <td>{row.points}</td>
                  <td>{row.style_points}</td>
                  <td><strong>{row.total}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Admin: lisää rasti */}
      {user.isAdmin && (
        <section className="card">
          <h2>Lisää rasti kisaan 🛠️</h2>
          <form onSubmit={addStation} className="inline-form">
            <select value={newStationEvent} onChange={(e) => setNewStationEvent(e.target.value)}>
              <option value="">Valitse laji…</option>
              {eventTypes.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
            <button type="submit" disabled={!newStationEvent}>Lisää</button>
          </form>
          {error && <p className="error-text">{error}</p>}
        </section>
      )}

      {/* Rastit + pisteytys */}
      {stations.map((station) => (
        <StationCard
          key={station.id}
          station={station}
          participants={comp.participants}
          competitionLocked={locked}
          onChanged={load}
        />
      ))}
    </div>
  );
}
