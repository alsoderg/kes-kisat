import { useState } from "react";
import { Check } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const THEMES = [
  { id: "kesa", label: "☀️ Kesä", gradient: "from-amber-300 to-orange-500" },
  { id: "meri", label: "🌊 Meri", gradient: "from-cyan-400 to-blue-600" },
  { id: "auringonlasku", label: "🌅 Auringonlasku", gradient: "from-orange-400 via-rose-500 to-purple-600" },
  { id: "yo", label: "🌙 Yö", gradient: "from-indigo-500 to-violet-700" },
  { id: "metsa", label: "🌲 Metsä", gradient: "from-green-400 to-emerald-700" },
  { id: "ruusu", label: "🌹 Ruusu", gradient: "from-pink-400 to-fuchsia-600" },
  { id: "minttu", label: "🍃 Minttu", gradient: "from-teal-300 to-emerald-500" },
  { id: "laventeli", label: "💜 Laventeli", gradient: "from-purple-300 to-violet-500" },
  { id: "tuli", label: "🔥 Tuli", gradient: "from-red-500 to-orange-500" },
  { id: "jaa", label: "❄️ Jää", gradient: "from-sky-200 to-cyan-500" },
];

export default function ProfileView() {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [theme, setTheme] = useState(user.theme);
  const [msg, setMsg] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  // Esikatselu: vaihda aksentti heti kun teemaa klikataan
  function pickTheme(id) {
    setTheme(id);
    document.documentElement.dataset.theme = id;
  }

  async function saveProfile(e) {
    e.preventDefault();
    setMsg("");
    try { await updateProfile({ displayName, theme }); setMsg("Tallennettu ✓"); }
    catch (err) { setMsg(err.message); }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwMsg("");
    try {
      await api.post("/auth/me/password", { currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword(""); setPwMsg("Salasana vaihdettu ✓");
    } catch (err) { setPwMsg(err.message); }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader><CardTitle>Profiili</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="flex flex-col gap-4">
            <Label className="flex-col items-start gap-1.5">
              Näyttönimi
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Label>

            <div className="flex flex-col gap-2">
              <Label>Aksenttiteema</Label>
              <p className="-mt-1 text-xs text-muted-foreground">
                Tausta on aina tumma — väri vaihtaa vain korostusvärin.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {THEMES.map((t) => (
                  <button type="button" key={t.id} onClick={() => pickTheme(t.id)}
                    className={cn(
                      "flex flex-col gap-2 rounded-lg border p-2 text-left transition-all cursor-pointer hover:border-primary/60",
                      theme === t.id ? "border-primary ring-2 ring-primary/40" : "border-border/60"
                    )}>
                    <span className={cn("h-9 w-full rounded-md bg-linear-to-r", t.gradient)} />
                    <span className="flex items-center justify-between text-xs font-medium">
                      {t.label}
                      {theme === t.id && <Check className="size-3.5 text-primary" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {msg && <p className="text-sm text-emerald-400">{msg}</p>}
            <Button type="submit" className="w-full">Tallenna</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Vaihda salasana 🔑</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="flex flex-col gap-3">
            <Input type="password" placeholder="Nykyinen salasana" value={currentPassword}
              autoComplete="current-password" onChange={(e) => setCurrentPassword(e.target.value)} />
            <Input type="password" placeholder="Uusi salasana" value={newPassword}
              autoComplete="new-password" onChange={(e) => setNewPassword(e.target.value)} />
            {pwMsg && <p className="text-sm text-emerald-400">{pwMsg}</p>}
            <Button type="submit" className="w-full">Vaihda salasana</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
