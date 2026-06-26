import { useEffect, useState } from "react";
import { Lock, Unlock, Megaphone, ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function StationCard({ station, participants, competitionLocked, onChanged }) {
  const { user } = useAuth();
  const [results, setResults] = useState({});
  const [showRules, setShowRules] = useState(false);
  const locked = station.is_locked || competitionLocked;

  async function loadResults() {
    const rows = await api.get(`/stations/${station.id}/results`);
    const map = {};
    for (const r of rows) map[r.user_id] = { points: r.points, style_points: r.style_points };
    setResults(map);
  }
  useEffect(() => {
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [station.id]);

  async function save(userId, field, value) {
    const current = results[userId] ?? { points: 0, style_points: 0 };
    const next = { ...current, [field]: value };
    setResults((prev) => ({ ...prev, [userId]: next }));
    try {
      await api.put(`/stations/${station.id}/results`, {
        userId, points: Number(next.points) || 0, stylePoints: Number(next.style_points) || 0,
      });
    } catch (err) { alert(err.message); }
  }

  async function toggleLock() {
    await api.patch(`/stations/${station.id}`, { isLocked: !station.is_locked });
    onChanged();
  }
  async function shareToDiscord() {
    try { await api.post(`/admin/discord/station/${station.id}`); alert("Rastin tulokset jaettu Discordiin!"); }
    catch (err) { alert(err.message); }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            {locked && <Lock className="size-4 text-muted-foreground" />}
            {station.name}
          </CardTitle>
          {user.isAdmin && (
            <Button size="sm" variant="secondary" onClick={shareToDiscord}><Megaphone className="size-4" /> Jaa</Button>
          )}
        </div>
        {station.description && <p className="text-sm text-muted-foreground">{station.description}</p>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {station.rules && (
          <div>
            <button onClick={() => setShowRules((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-medium text-primary cursor-pointer">
              {showRules ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              <BookOpen className="size-3.5" /> Säännöt
            </button>
            {showRules && (
              <p className="mt-2 rounded-lg bg-primary/10 p-3 text-sm text-foreground/90">{station.rules}</p>
            )}
          </div>
        )}

        {participants.length === 0 ? (
          <p className="italic text-muted-foreground">Ei osallistujia kisassa vielä.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pelaaja</TableHead>
                <TableHead className="w-24 text-right">Pisteet</TableHead>
                <TableHead className="w-24 text-right">Tyyli ✨</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((p) => {
                const r = results[p.id] ?? { points: "", style_points: "" };
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.display_name}</TableCell>
                    <TableCell className="text-right">
                      <Input type="number" inputMode="numeric" disabled={locked} value={r.points ?? ""}
                        onChange={(e) => save(p.id, "points", e.target.value)}
                        className="ml-auto h-9 w-20 text-center" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input type="number" inputMode="numeric" disabled={locked} value={r.style_points ?? ""}
                        onChange={(e) => save(p.id, "style_points", e.target.value)}
                        className="ml-auto h-9 w-20 text-center" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {user.isAdmin && (
          <Button size="sm" variant="outline" className="self-start" onClick={toggleLock}>
            {station.is_locked ? <><Unlock className="size-4" /> Avaa rastin lukitus</> : <><Lock className="size-4" /> Lukitse rasti</>}
          </Button>
        )}
        {locked && !station.is_locked && (
          <p className="text-sm italic text-muted-foreground">Kisa on lukittu – pisteitä ei voi muokata.</p>
        )}
      </CardContent>
    </Card>
  );
}
