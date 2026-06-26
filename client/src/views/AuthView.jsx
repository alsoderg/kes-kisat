import { useState } from "react";
import { useAuth } from "../auth.jsx";

export default function AuthView() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register(username, password, displayName);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app auth-screen">
      <div className="card auth-card">
        <h1>☀️ KesäkisApp 🏆</h1>
        <div className="seg">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>
            Kirjaudu
          </button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>
            Luo tili
          </button>
        </div>
        <form onSubmit={submit} className="stack-form">
          <input
            placeholder="Käyttäjänimi"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          {mode === "register" && (
            <input
              placeholder="Näyttönimi (valinnainen)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          )}
          <input
            type="password"
            placeholder="Salasana"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {error && <p className="error-text">{error}</p>}
          <button className="primary-btn" type="submit" disabled={busy}>
            {mode === "login" ? "Kirjaudu sisään" : "Luo tili ja kirjaudu"}
          </button>
        </form>
      </div>
    </div>
  );
}
