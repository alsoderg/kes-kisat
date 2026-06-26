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
  { id: "kesa", label: "☀️ Kesä", swatch: "bg-amber-400" },
  { id: "meri", label: "🌊 Meri", swatch: "bg-sky-400" },
  { id: "auringonlasku", label: "🌅 Auringonlasku", swatch: "bg-rose-500" },
  { id: "yo", label: "🌙 Yö", swatch: "bg-violet-500" },
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
              <Label>Aksenttiteema (tausta on aina tumma)</Label>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map((t) => (
                  <button type="button" key={t.id} onClick={() => pickTheme(t.id)}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer hover:bg-muted/60",
                      theme === t.id ? "border-primary ring-2 ring-primary/40" : "border-border/60"
                    )}>
                    <span className="flex items-center gap-2">
                      <span className={cn("size-3.5 rounded-full", t.swatch)} /> {t.label}
                    </span>
                    {theme === t.id && <Check className="size-4 text-primary" />}
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
