import { useMemo, useState } from "react";

export default function StatsTab({ players, stations, scores, totals }) {
  const [sortKey, setSortKey] = useState("total");
  const [sortDir, setSortDir] = useState("desc");
  const [stationFilter, setStationFilter] = useState("all");

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sortedTotals = useMemo(() => {
    const copy = [...totals];
    copy.sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortDir === "asc" ? diff : -diff;
    });
    return copy;
  }, [totals, sortKey, sortDir]);

  const sortArrow = (key) => (sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  const stationRows = useMemo(() => {
    if (stationFilter === "all") return null;
    const station = stations.find((s) => String(s.id) === stationFilter);
    if (!station) return null;
    const stationScores = scores[station.id] ?? {};
    const rows = players.map((p) => {
      const s = stationScores[p.id] ?? { points: 0, style: 0 };
      const points = Number(s.points) || 0;
      const style = Number(s.style) || 0;
      return { name: p.name, points, style, total: points + style };
    });
    rows.sort((a, b) => b.total - a.total);
    return rows;
  }, [stationFilter, stations, scores, players]);

  if (players.length === 0) {
    return <p className="empty-hint">Ei osallistujia – tilastot ilmestyvät kun rekisteröidyt.</p>;
  }

  return (
    <div className="card-stack">
      <section className="card">
        <h2>Kokonaistilanne 🏆</h2>
        <table className="score-table sortable">
          <thead>
            <tr>
              <th onClick={() => toggleSort("name")}>Pelaaja{sortArrow("name")}</th>
              <th onClick={() => toggleSort("points")}>Pisteet{sortArrow("points")}</th>
              <th onClick={() => toggleSort("style")}>Tyyli ✨{sortArrow("style")}</th>
              <th onClick={() => toggleSort("total")}>Yhteensä{sortArrow("total")}</th>
            </tr>
          </thead>
          <tbody>
            {sortedTotals.map((row, i) => (
              <tr key={row.playerId} className={i === 0 ? "leader" : ""}>
                <td>{row.name}</td>
                <td>{row.points}</td>
                <td>{row.style}</td>
                <td>
                  <strong>{row.total}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>Rastikohtaiset tulokset 📍</h2>
        <select value={stationFilter} onChange={(e) => setStationFilter(e.target.value)}>
          <option value="all">Valitse rasti...</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {stationRows && (
          <table className="score-table">
            <thead>
              <tr>
                <th>Pelaaja</th>
                <th>Pisteet</th>
                <th>Tyyli ✨</th>
                <th>Yhteensä</th>
              </tr>
            </thead>
            <tbody>
              {stationRows.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.points}</td>
                  <td>{row.style}</td>
                  <td>
                    <strong>{row.total}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
