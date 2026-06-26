import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth.jsx";

export default function StationCard({ station, participants, competitionLocked, onChanged }) {
  const { user } = useAuth();
  const [results, setResults] = useState({}); // userId -> {points, style_points}
  const [showRules, setShowRules] = useState(false);
  const locked = station.is_locked || competitionLocked;

  async function loadResults() {
    const rows = await api.get(`/stations/${station.id}/results`);
    const map = {};
    for (const r of rows) map[r.user_id] = { points: r.points, style_points: r.style_points };
    setResults(map);
  }
  useEffect(() => {
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [station.id]);

  async function save(userId, field, value) {
    const current = results[userId] ?? { points: 0, style_points: 0 };
    const next = { ...current, [field]: value };
    setResults((prev) => ({ ...prev, [userId]: next }));
    try {
      await api.put(`/stations/${station.id}/results`, {
        userId,
        points: Number(next.points) || 0,
        stylePoints: Number(next.style_points) || 0,
      });
    } catch (err) {
      alert(err.message);
    }
  }

  async function toggleLock() {
    await api.patch(`/stations/${station.id}`, { isLocked: !station.is_locked });
    onChanged();
  }

  async function shareToDiscord() {
    try {
      await api.post(`/admin/discord/station/${station.id}`);
      alert("Rastin tulokset jaettu Discordiin!");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <section className="card">
      <div className="station-header">
        <h2>{locked ? "🔒 " : ""}{station.name}</h2>
        {user.isAdmin && (
          <button className="share-btn" onClick={shareToDiscord}>📣 Jaa</button>
        )}
      </div>
      {station.description && <p className="station-desc">{station.description}</p>}

      {station.rules && (
        <div className="rules-box">
          <button className="link-btn" onClick={() => setShowRules((v) => !v)}>
            {showRules ? "▾ Piilota säännöt" : "▸ Näytä säännöt"}
          </button>
          {showRules && <p className="rules-text">{station.rules}</p>}
        </div>
      )}

      {participants.length === 0 ? (
        <p className="empty-hint">Ei osallistujia kisassa vielä.</p>
      ) : (
        <table className="score-table">
          <thead>
            <tr><th>Pelaaja</th><th>Pisteet</th><th>Tyyli ✨</th></tr>
          </thead>
          <tbody>
            {participants.map((p) => {
              const r = results[p.id] ?? { points: "", style_points: "" };
              return (
                <tr key={p.id}>
                  <td>{p.display_name}</td>
                  <td>
                    <input type="number" inputMode="numeric" disabled={locked}
                      value={r.points ?? ""}
                      onChange={(e) => save(p.id, "points", e.target.value)} />
                  </td>
                  <td>
                    <input type="number" inputMode="numeric" disabled={locked}
                      value={r.style_points ?? ""}
                      onChange={(e) => save(p.id, "style_points", e.target.value)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {user.isAdmin && (
        <button className="share-btn lock-btn" onClick={toggleLock}>
          {station.is_locked ? "🔓 Avaa rastin lukitus" : "🔒 Lukitse rasti"}
        </button>
      )}
      {locked && !station.is_locked && (
        <p className="empty-hint">Kisa on lukittu – pisteitä ei voi muokata.</p>
      )}
    </section>
  );
}
