import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function EventsTab() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [standings, setStandings] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setEvents(await api.get("/event-types"));
  }
  useEffect(() => {
    load();
  }, []);

  async function openEvent(ev) {
    if (openId === ev.id) { setOpenId(null); return; }
    setOpenId(ev.id);
    setStandings(await api.get(`/stats/event-types/${ev.id}/standings`));
  }

  async function addEvent(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/event-types", { name, description, defaultRules: rules });
      setName(""); setDescription(""); setRules("");
      load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="flex flex-col gap-4">
      {user?.isAdmin && (
        <Card>
          <CardHeader><CardTitle>Lisää laji katalogiin</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addEvent} className="flex flex-col gap-3">
              <Input placeholder="Lajin nimi" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Kuvaus" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Textarea placeholder="Säännöt (oletus)" value={rules} onChange={(e) => setRules(e.target.value)} rows={3} />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full"><Plus className="size-4" /> Lisää laji</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lajikatalogi</CardTitle>
          <p className="text-sm text-muted-foreground">Avaa laji nähdäksesi kaikkien kisojen yhteistuloksen.</p>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="italic text-muted-foreground">Ei lajeja vielä.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {events.map((ev) => (
                <li key={ev.id} className="rounded-lg border border-border/60 bg-muted/30">
                  <button onClick={() => openEvent(ev)}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left cursor-pointer">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold">{ev.name}</span>
                      {ev.description && <span className="text-xs text-muted-foreground">{ev.description}</span>}
                    </div>
                    {openId === ev.id ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                  </button>
                  {openId === ev.id && (
                    <div className="border-t border-border/60 px-4 py-3">
                      {ev.default_rules && (
                        <p className="mb-3 rounded-lg bg-primary/10 p-3 text-sm">
                          <span className="font-semibold">Säännöt: </span>{ev.default_rules}
                        </p>
                      )}
                      {standings.length === 0 ? (
                        <p className="italic text-muted-foreground">Ei tuloksia vielä.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Pelaaja</TableHead>
                              <TableHead className="text-right">Paras</TableHead>
                              <TableHead className="text-right">Yht.</TableHead>
                              <TableHead className="text-right">Yrityksiä</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {standings.map((row) => (
                              <TableRow key={row.user_id}>
                                <TableCell className="font-medium">{row.display_name}</TableCell>
                                <TableCell className="text-right font-bold">{row.best}</TableCell>
                                <TableCell className="text-right">{row.total}</TableCell>
                                <TableCell className="text-right">{row.attempts}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
