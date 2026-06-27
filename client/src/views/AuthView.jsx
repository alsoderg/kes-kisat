import { useState } from "react";
import { Sun } from "lucide-react";
import { useAuth } from "../auth.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AuthView({ onClose }) {
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
      if (mode === "login") await login(username, password);
      else await register(username, password, displayName);
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="items-center text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Sun className="size-6 text-primary" /> KesäkisApp
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/60 p-1">
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md py-2 text-sm font-medium transition-colors cursor-pointer ${
                mode === m ? "bg-card text-foreground shadow" : "text-muted-foreground"
              }`}
            >
              {m === "login" ? "Kirjaudu" : "Luo tili"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <Input placeholder="Käyttäjänimi" value={username} autoComplete="username"
            onChange={(e) => setUsername(e.target.value)} />
          {mode === "register" && (
            <Input placeholder="Näyttönimi (valinnainen)" value={displayName}
              onChange={(e) => setDisplayName(e.target.value)} />
          )}
          <Input type="password" placeholder="Salasana" value={password}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {mode === "login" ? "Kirjaudu sisään" : "Luo tili ja kirjaudu"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
