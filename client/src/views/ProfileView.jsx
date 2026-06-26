import { useState } from "react";
import { api } from "../api";
import { useAuth } from "../auth.jsx";

const THEMES = [
  { id: "kesa", label: "☀️ Kesä" },
  { id: "meri", label: "🌊 Meri" },
  { id: "auringonlasku", label: "🌅 Auringonlasku" },
  { id: "yo", label: "🌙 Yö" },
];

export default function ProfileView() {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [theme, setTheme] = useState(user.theme);
  const [msg, setMsg] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  async function saveProfile(e) {
    e.preventDefault();
    setMsg("");
    try {
      await updateProfile({ displayName, theme });
      setMsg("Tallennettu ✓");
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwMsg("");
    try {
      await api.post("/auth/me/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPwMsg("Salasana vaihdettu ✓");
    } catch (err) {
      setPwMsg(err.message);
    }
  }

  return (
    <div className="card-stack">
      <section className="card">
        <h2>Profiili 👤</h2>
        <form onSubmit={saveProfile} className="stack-form">
          <label className="field-label">Näyttönimi
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </label>
          <label className="field-label">Teema</label>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                type="button"
                key={t.id}
                className={`theme-chip theme-${t.id} ${theme === t.id ? "selected" : ""}`}
                onClick={() => setTheme(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {msg && <p className="ok-text">{msg}</p>}
          <button className="primary-btn" type="submit">Tallenna</button>
        </form>
      </section>

      <section className="card">
        <h2>Vaihda salasana 🔑</h2>
        <form onSubmit={changePassword} className="stack-form">
          <input type="password" placeholder="Nykyinen salasana" value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
          <input type="password" placeholder="Uusi salasana" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
          {pwMsg && <p className="ok-text">{pwMsg}</p>}
          <button className="primary-btn" type="submit">Vaihda salasana</button>
        </form>
      </section>
    </div>
  );
}
