import { useEffect, useState } from "react";
import { Lock, Users, MapPin, ChevronRight } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth.jsx";
import { useUrlParam } from "../useUrlState.js";
import CompetitionDetail from "./CompetitionDetail.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CompetitionsTab() {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState([]);
  const [openId, setOpenId] = useUrlParam("comp", "");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setCompetitions(await api.get("/competitions"));
  }
  useEffect(() => {
    load();
  }, []);

  async function addCompetition(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/competitions", { name, location, startTime: startTime || null });
      setName(""); setLocation(""); setStartTime("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (openId) {
    return <CompetitionDetail competitionId={openId} onBack={() => { setOpenId(""); load(); }} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {user?.isAdmin && (
        <Card>
          <CardHeader><CardTitle>Luo uusi kisa</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addCompetition} className="flex flex-col gap-3">
              <Input placeholder="Kisan nimi" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Paikka" value={location} onChange={(e) => setLocation(e.target.value)} />
              <Label className="flex-col items-start gap-1.5">
                Alkamisaika
                <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </Label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">Luo kisa</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Kisat</CardTitle></CardHeader>
        <CardContent>
          {competitions.length === 0 ? (
            <p className="italic text-muted-foreground">Ei kisoja vielä.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {competitions.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setOpenId(c.id)}
                    className="group flex w-full items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/60 cursor-pointer"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 font-semibold">
                        {c.is_locked && <Lock className="size-3.5 text-muted-foreground" />}
                        {c.name}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {c.location && <span className="flex items-center gap-1"><MapPin className="size-3" />{c.location}</span>}
                        <span className="flex items-center gap-1"><Users className="size-3" />{c.participant_count} osallistujaa</span>
                        <span>{c.station_count} rastia</span>
                      </span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
