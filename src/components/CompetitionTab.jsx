export default function CompetitionTab({
  players,
  stations,
  currentStation,
  currentStationIndex,
  scores,
  setScore,
  isAdmin,
  onApproveAndAdvance,
  onGoToStation,
  onShareToDiscord,
  discordWebhookUrl,
}) {
  if (!currentStation) {
    return <p className="empty-hint">Ei rasteja määritelty. Lisää rasteja admin-tilassa.</p>;
  }

  if (players.length === 0) {
    return <p className="empty-hint">Ilmoittaudu ensin Rekisteröinti-välilehdellä!</p>;
  }

  const stationScores = scores[currentStation.id] ?? {};
  const isLast = currentStationIndex === stations.length - 1;

  return (
    <div className="card-stack">
      <section className="card station-progress">
        {stations.map((s, i) => (
          <button
            key={s.id}
            className={`station-pill ${i === currentStationIndex ? "active" : ""} ${
              i < currentStationIndex ? "done" : ""
            }`}
            onClick={() => isAdmin && onGoToStation(i)}
            disabled={!isAdmin}
          >
            {i + 1}
          </button>
        ))}
      </section>

      <section className="card">
        <div className="station-header">
          <h2>
            Rasti {currentStationIndex + 1}/{stations.length}: {currentStation.name}
          </h2>
          {discordWebhookUrl && (
            <button className="share-btn" onClick={() => onShareToDiscord(currentStation)}>
              📣 Jaa Discordiin
            </button>
          )}
        </div>
        <p className="station-desc">{currentStation.description}</p>

        <table className="score-table">
          <thead>
            <tr>
              <th>Pelaaja</th>
              <th>Pisteet</th>
              <th>Tyylipisteet ✨</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const s = stationScores[p.id] ?? { points: "", style: "" };
              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={s.points}
                      onChange={(e) => setScore(currentStation.id, p.id, "points", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={s.style}
                      onChange={(e) => setScore(currentStation.id, p.id, "style", e.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {isAdmin ? (
          <button className="primary-btn" onClick={onApproveAndAdvance}>
            {isLast ? "✅ Hyväksy lopputulokset" : "✅ Hyväksy ja siirry seuraavaan rastiin"}
          </button>
        ) : (
          <p className="empty-hint">Odota, että admin hyväksyy rastin ja siirtää kisan eteenpäin.</p>
        )}
      </section>
    </div>
  );
}
