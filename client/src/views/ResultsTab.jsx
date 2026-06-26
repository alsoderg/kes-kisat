import { useEffect, useState } from "react";
import { api } from "../api";

export default function ResultsTab() {
  const [overall, setOverall] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [selectedComp, setSelectedComp] = useState("");
  const [compStandings, setCompStandings] = useState([]);
  const [stations, setStations] = useState([]);
  const [openStation, setOpenStation] = useState(null);
  const [stationResults, setStationResults] = useState([]);

  useEffect(() => {
    api.get("/stats/overall").then(setOverall);
    api.get("/competitions").then(setCompetitions);
  }, []);

  async function pickComp(id) {
    setSelectedComp(id);
    setOpenStation(null);
    if (!id) {
      setCompStandings([]);
      setStations([]);
      return;
    }
    const [st, s] = await Promise.all([
      api.get(`/stats/competitions/${id}/standings`),
      api.get(`/competitions/${id}/stations`),
    ]);
    setCompStandings(st);
    setStations(s);
  }

  async function openStationResults(stationId) {
    if (openStation === stationId) {
      setOpenStation(null);
      return;
    }
    setOpenStation(stationId);
    setStationResults(await api.get(`/stations/${stationId}/results`));
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="card-stack">
      {/* Kisakohtaiset + lajikohtaiset */}
      <section className="card">
        <h2>Kisakohtaiset tulokset 🏁</h2>
        <select value={selectedComp} onChange={(e) => pickComp(e.target.value)}>
          <option value="">Valitse kisa…</option>
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {selectedComp && (
          <>
            {compStandings.length === 0 ? (
              <p className="empty-hint">Ei tuloksia.</p>
            ) : (
              <table className="score-table">
                <thead>
                  <tr><th>Sija</th><th>Pelaaja</th><th>Pisteet</th><th>Tyyli ✨</th><th>Yhteensä</th></tr>
                </thead>
                <tbody>
                  {compStandings.map((row, i) => (
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

            <h3 className="subhead">Lajikohtaiset (avaa rasti)</h3>
            <ul className="comp-list">
              {stations.map((s) => (
                <li key={s.id}>
                  <button className="comp-row" onClick={() => openStationResults(s.id)}>
                    <span className="comp-name">{s.name}</span>
                  </button>
                  {openStation === s.id && (
                    <div className="event-detail">
                      {stationResults.length === 0 ? (
                        <p className="empty-hint">Ei tuloksia.</p>
                      ) : (
                        <table className="score-table">
                          <thead>
                            <tr><th>Pelaaja</th><th>Pisteet</th><th>Tyyli ✨</th><th>Yhteensä</th></tr>
                          </thead>
                          <tbody>
                            {stationResults.map((row) => (
                              <tr key={row.user_id}>
                                <td>{row.display_name}</td>
                                <td>{row.points}</td>
                                <td>{row.style_points}</td>
                                <td><strong>{row.total}</strong></td>
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
          </>
        )}
      </section>

      {/* Kokonaistulokset yli kisojen */}
      <section className="card">
        <h2>Kokonaistulokset (kaikki kisat) 🏆</h2>
        {overall.length === 0 ? (
          <p className="empty-hint">Ei tuloksia vielä.</p>
        ) : (
          <table className="score-table">
            <thead>
              <tr><th>Sija</th><th>Pelaaja</th><th>Yhteensä</th><th>Kisoja</th></tr>
            </thead>
            <tbody>
              {overall.map((row, i) => (
                <tr key={row.user_id} className={i === 0 ? "leader" : ""}>
                  <td>{medals[i] ?? i + 1}</td>
                  <td>{row.display_name}</td>
                  <td><strong>{row.total}</strong></td>
                  <td>{row.competitions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
