import { useEffect, useState } from "react";
import { api } from "../api";

export default function AdminPanel() {
  const [webhook, setWebhook] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/admin/settings").then((s) => setWebhook(s.discordWebhookUrl || ""));
  }, []);

  async function saveWebhook(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api.put("/admin/settings", { discordWebhookUrl: webhook.trim() });
      setMsg("Tallennettu ✓");
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function sendKickoff() {
    try {
      await api.post("/admin/discord/announce", {
        message: "@everyone KESÄKISAT ALKAA KOHTA 🏆☀️",
        mentionEveryone: true,
      });
      alert("Ilmoitus lähetetty Discordiin!");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="card-stack">
      <section className="card">
        <h2>Hallintapaneeli 🛠️</h2>
        <p className="station-desc">
          Discord-webhook tallentuu palvelimelle (ei näy selaimessa). Kaikki Discord-jaot käyttävät tätä.
        </p>
        <form onSubmit={saveWebhook} className="stack-form">
          <input
            placeholder="https://discord.com/api/webhooks/..."
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
          />
          {msg && <p className="ok-text">{msg}</p>}
          <button className="primary-btn" type="submit">Tallenna webhook</button>
        </form>
        {webhook && (
          <button className="share-btn kickoff-btn" onClick={sendKickoff}>
            🚨 Lähetä "Kesäkisat alkaa kohta"
          </button>
        )}
      </section>
    </div>
  );
}
