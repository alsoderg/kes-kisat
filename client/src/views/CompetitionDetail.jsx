import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, MapPin, Clock, Users, Lock, Unlock, Megaphone, PartyPopper, Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth.jsx";
import { useConfirm } from "@/components/ConfirmDialog.jsx";
import StationCard from "./StationCard.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const medals = ["🥇", "🥈", "🥉"];

function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CompetitionDetail({ competitionId, onBack }) {
  const { user } = useAuth();
  const confirm = useConfirm();
  const isAdmin = !!user?.isAdmin;
  const [comp, setComp] = useState(null);
  const [stations, setStations] = useState([]);
  const [standings, setStandings] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [newStationEvent, setNewStationEvent] = useState("");
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", description: "", startTime: "" });

  const load = useCallback(async () => {
    const [c, s, st] = await Promise.all([
      api.get(`/competitions/${competitionId}`),
      api.get(`/competitions/${competitionId}/stations`),
      api.get(`/stats/competitions/${competitionId}/standings`),
    ]);
    setComp(c); setStations(s); setStandings(st);
  }, [competitionId]);

  useEffect(() => {
    load();
    if (isAdmin) api.get("/event-types").then(setEventTypes);
  }, [load, isAdmin]);

  if (!comp) return <p className="italic text-muted-foreground">Ladataan…</p>;

  const isParticipant = comp.participants.some((p) => p.id === user?.id);
  const locked = comp.is_locked;

  async function toggleJoin() {
    if (isParticipant) {
      const ok = await confirm({
        title: "Poistu kisasta",
        description: `Poistutaanko kisasta "${comp.name}"? Voit liittyä uudelleen myöhemmin.`,
        confirmLabel: "Poistu",
      });
      if (!ok) return;
      await api.del(`/competitions/${competitionId}/join`);
    } else {
      await api.post(`/competitions/${competitionId}/join`);
    }
    load();
  }
  async function toggleLock() {
    await api.patch(`/competitions/${competitionId}`, { isLocked: !locked });
    load();
  }
  function startEdit() {
    setForm({
      name: comp.name,
      location: comp.location ?? "",
      description: comp.description ?? "",
      startTime: toLocalInput(comp.start_time),
    });
    setEditing(true);
  }
  async function saveEdit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.patch(`/competitions/${competitionId}`, {
        name: form.name,
        location: form.location,
        description: form.description,
        startTime: form.startTime || null,
      });
      setEditing(false);
      load();
    } catch (err) { setError(err.message); }
  }
  async function deleteCompetition() {
    const ok = await confirm({
      title: "Poista kisa",
      description: `Poistetaanko kisa "${comp.name}" ja kaikki sen rastit ja tulokset? Tätä ei voi perua.`,
      confirmLabel: "Poista",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await api.del(`/competitions/${competitionId}`);
      onBack();
    } catch (err) { alert(err.message); }
  }
  async function addStation() {
    setError("");
    try {
      await api.post(`/competitions/${competitionId}/stations`, {
        eventTypeId: Number(newStationEvent), position: stations.length,
      });
      setNewStationEvent("");
      load();
    } catch (err) { setError(err.message); }
  }
  async function shareStandings() {
    try { await api.post(`/admin/discord/competition/${competitionId}/standings`); alert("Tilanne jaettu Discordiin!"); }
    catch (err) { alert(err.message); }
  }
  async function announceStart() {
    try { await api.post(`/admin/discord/start-time/${competitionId}`); alert("Alkamisaika ilmoitettu!"); }
    catch (err) { alert(err.message); }
  }

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" className="self-start" onClick={onBack}>
        <ArrowLeft className="size-4" /> Takaisin kisoihin
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              {locked && <Lock className="size-4 text-muted-foreground" />}
              {comp.name}
            </CardTitle>
            {user && !locked && (
              <Button size="sm" variant={isParticipant ? "outline" : "default"} onClick={toggleJoin}>
                {isParticipant ? "Poistu kisasta" : "Liity kisaan"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          {comp.description && <p className="text-foreground/80">{comp.description}</p>}
          {comp.location && <span className="flex items-center gap-1.5"><MapPin className="size-4" />{comp.location}</span>}
          {comp.start_time && <span className="flex items-center gap-1.5"><Clock className="size-4" />{new Date(comp.start_time).toLocaleString("fi-FI")}</span>}
          <span className="flex items-center gap-1.5"><Users className="size-4" />{comp.participants.length} osallistujaa</span>

          {isAdmin && (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={toggleLock}>
                {locked ? <><Unlock className="size-4" /> Avaa lukitus</> : <><Lock className="size-4" /> Lukitse kisa</>}
              </Button>
              <Button size="sm" variant="secondary" onClick={startEdit}><Pencil className="size-4" /> Muokkaa</Button>
              <Button size="sm" variant="secondary" onClick={shareStandings}><Megaphone className="size-4" /> Jaa tilanne</Button>
              {comp.start_time && <Button size="sm" variant="secondary" onClick={announceStart}><PartyPopper className="size-4" /> Ilmoita aika</Button>}
              <Button size="sm" variant="destructive" onClick={deleteCompetition}><Trash2 className="size-4" /> Poista kisa</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin: muokkauslomake */}
      {isAdmin && editing && (
        <Card>
          <CardHeader><CardTitle>Muokkaa kisaa</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={saveEdit} className="flex flex-col gap-3">
              <Input placeholder="Kisan nimi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Paikka" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <Textarea placeholder="Kuvaus" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              <Label className="flex-col items-start gap-1.5">
                Alkamisaika
                <Input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </Label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Tallenna</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>Peruuta</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Kisan tilanne 🏆</CardTitle></CardHeader>
        <CardContent>
          {standings.length === 0 ? (
            <p className="italic text-muted-foreground">Ei tuloksia vielä.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">Sija</TableHead>
                  <TableHead>Pelaaja</TableHead>
                  <TableHead className="text-right">Pisteet</TableHead>
                  <TableHead className="text-right">Tyyli ✨</TableHead>
                  <TableHead className="text-right">Yht.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((row, i) => (
                  <TableRow key={row.user_id} className={i === 0 ? "bg-primary/10" : ""}>
                    <TableCell>{medals[i] ?? i + 1}</TableCell>
                    <TableCell className="font-medium">{row.display_name}</TableCell>
                    <TableCell className="text-right">{row.points}</TableCell>
                    <TableCell className="text-right">{row.style_points}</TableCell>
                    <TableCell className="text-right font-bold">{row.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader><CardTitle>Lisää rasti kisaan</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Select value={newStationEvent} onValueChange={setNewStationEvent}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Valitse laji…" /></SelectTrigger>
                <SelectContent>
                  {eventTypes.map((ev) => (
                    <SelectItem key={ev.id} value={String(ev.id)}>{ev.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addStation} disabled={!newStationEvent}><Plus className="size-4" /> Lisää</Button>
            </div>
            {error && !editing && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}

      {stations.map((station) => (
        <StationCard
          key={station.id}
          station={station}
          participants={comp.participants}
          competitionLocked={locked}
          onChanged={load}
        />
      ))}
    </div>
  );
}
