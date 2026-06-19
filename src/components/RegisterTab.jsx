import { useState } from "react";

export default function RegisterTab({
  players,
  onAddPlayer,
  onRemovePlayer,
  isAdmin,
  stations,
  onAddStation,
  onRemoveStation,
  discordWebhookUrl,
  onSetDiscordWebhookUrl,
}) {
  const [name, setName] = useState("");
  const [stationName, setStationName] = useState("");
  const [stationDesc, setStationDesc] = useState("");
  const [webhookInput, setWebhookInput] = useState(discordWebhookUrl);

  function submitWebhook(e) {
    e.preventDefault();
    onSetDiscordWebhookUrl(webhookInput.trim());
    alert("Discord-webhook tallennettu tähän puhelimeen.");
  }

  function submitPlayer(e) {
    e.preventDefault();
    onAddPlayer(name);
    setName("");
  }

  function submitStation(e) {
    e.preventDefault();
    onAddStation(stationName, stationDesc);
    setStationName("");
    setStationDesc("");
  }

  return (
    <div className="card-stack">
      <section className="card">
        <h2>Ilmoittaudu mukaan 🙋</h2>
        <form onSubmit={submitPlayer} className="inline-form">
          <input
            type="text"
            placeholder="Nimesi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <button type="submit">Lisää</button>
        </form>

        {players.length === 0 ? (
          <p className="empty-hint">Ei osallistujia vielä – ole ensimmäinen!</p>
        ) : (
          <ul className="player-list">
            {players.map((p) => (
              <li key={p.id}>
                <span>{p.name}</span>
                <button className="remove-btn" onClick={() => onRemovePlayer(p.id)} title="Poista">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="player-count">{players.length} osallistuja(a) ilmoittautunut</p>
      </section>

      {isAdmin && (
        <section className="card">
          <h2>Hallinnoi rasteja (admin) 🛠️</h2>
          <form onSubmit={submitStation} className="stack-form">
            <input
              type="text"
              placeholder="Rastin nimi"
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Kuvaus"
              value={stationDesc}
              onChange={(e) => setStationDesc(e.target.value)}
            />
            <button type="submit">Lisää rasti</button>
          </form>

          <ul className="station-list">
            {stations.map((s, i) => (
              <li key={s.id}>
                <span>
                  <strong>{i + 1}. {s.name}</strong> — {s.description}
                </span>
                <button className="remove-btn" onClick={() => onRemoveStation(s.id)} title="Poista">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isAdmin && (
        <section className="card">
          <h2>Discord-jako (admin) 📣</h2>
          <p className="station-desc">
            Liitä tähän kanavan webhook-URL, jotta rastien tulokset voi jakaa Discordiin. Tallentuu vain
            tähän puhelimeen, ei mihinkään muualle.
          </p>
          <form onSubmit={submitWebhook} className="stack-form">
            <input
              type="text"
              placeholder="https://discord.com/api/webhooks/..."
              value={webhookInput}
              onChange={(e) => setWebhookInput(e.target.value)}
            />
            <button type="submit">Tallenna webhook</button>
          </form>
          {discordWebhookUrl && <p className="player-count">✅ Webhook asetettu.</p>}
        </section>
      )}
    </div>
  );
}
