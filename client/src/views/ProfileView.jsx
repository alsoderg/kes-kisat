import { useState } from "react";
import { Check } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Värilliset teemat: koko tausta vaihtuu nimen mukaiseksi
const THEMES_LIGHT = [
  { id: "kesa-light", label: "☀️ Kesä", gradient: "from-amber-200 to-orange-400" },
  { id: "meri-light", label: "🌊 Meri", gradient: "from-sky-200 to-blue-400" },
  { id: "auringonlasku-light", label: "🌅 Auringonlasku", gradient: "from-orange-300 via-rose-300 to-pink-400" },
  { id: "metsa-light", label: "🌲 Metsä", gradient: "from-lime-200 to-emerald-400" },
];

// Tummat teemat: tumma tausta, vaihtuva korostusväri
const THEMES_DARK = [
  { id: "kesa", label: "Kesä", gradient: "from-amber-300 to-orange-500" },
  { id: "meri", label: "Meri", gradient: "from-cyan-400 to-blue-600" },
  { id: "auringonlasku", label: "Auringonlasku", gradient: "from-orange-400 via-rose-500 to-purple-600" },
  { id: "yo", label: "Yö", gradient: "from-indigo-500 to-violet-700" },
];

function ThemeChip({ t, selected, onPick }) {
  return (
    <button type="button" onClick={() => onPick(t.id)}
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-2 text-left transition-all cursor-pointer hover:border-primary/60",
        selected ? "border-primary ring-2 ring-primary/40" : "border-border/60"
      )}>
      <span className={cn("h-9 w-full rounded-md bg-linear-to-r", t.gradient)} />
      <span className="flex items-center justify-between text-xs font-medium">
        {t.label}
        {selected && <Check className="size-3.5 text-primary" />}
      </span>
    </button>
  );
}

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

            <div className="flex flex-col gap-3">
              <Label>Teema</Label>

              <p className="text-xs font-semibold text-muted-foreground">🌈 Värilliset</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {THEMES_LIGHT.map((t) => (
                  <ThemeChip key={t.id} t={t} selected={theme === t.id} onPick={pickTheme} />
                ))}
              </div>

              <p className="mt-1 text-xs font-semibold text-muted-foreground">🌙 Tummat</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {THEMES_DARK.map((t) => (
                  <ThemeChip key={t.id} t={t} selected={theme === t.id} onPick={pickTheme} />
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
