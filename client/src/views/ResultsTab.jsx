import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { api } from "../api";
import { useUrlParam } from "../useUrlState.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const medals = ["🥇", "🥈", "🥉"];

export default function ResultsTab() {
  const [overall, setOverall] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [selectedComp, setSelectedComp] = useUrlParam("rcomp", "");
  const [compStandings, setCompStandings] = useState([]);
  const [stations, setStations] = useState([]);
  const [openStation, setOpenStation] = useState(null);
  const [stationResults, setStationResults] = useState([]);

  useEffect(() => {
    api.get("/stats/overall").then(setOverall);
    api.get("/competitions").then(setCompetitions);
  }, []);

  // Lataa valitun kisan tiedot kun URL-parametri muuttuu (myös suoraan linkistä)
  useEffect(() => {
    setOpenStation(null);
    if (!selectedComp) { setCompStandings([]); setStations([]); return; }
    Promise.all([
      api.get(`/stats/competitions/${selectedComp}/standings`),
      api.get(`/competitions/${selectedComp}/stations`),
    ]).then(([st, s]) => { setCompStandings(st); setStations(s); })
      .catch(() => { setCompStandings([]); setStations([]); });
  }, [selectedComp]);

  async function openStationResults(stationId) {
    if (openStation === stationId) { setOpenStation(null); return; }
    setOpenStation(stationId);
    setStationResults(await api.get(`/stations/${stationId}/results`));
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader><CardTitle>Kisakohtaiset tulokset 🏁</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Select value={selectedComp} onValueChange={setSelectedComp}>
            <SelectTrigger><SelectValue placeholder="Valitse kisa…" /></SelectTrigger>
            <SelectContent>
              {competitions.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedComp && (
            <>
              {compStandings.length === 0 ? (
                <p className="italic text-muted-foreground">Ei tuloksia.</p>
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
                    {compStandings.map((row, i) => (
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

              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Lajikohtaiset (avaa rasti)</h3>
                <ul className="flex flex-col gap-2">
                  {stations.map((s) => (
                    <li key={s.id} className="rounded-lg border border-border/60 bg-muted/30">
                      <button onClick={() => openStationResults(s.id)}
                        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left font-medium cursor-pointer">
                        {s.name}
                        {openStation === s.id ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                      </button>
                      {openStation === s.id && (
                        <div className="border-t border-border/60 px-4 py-3">
                          {stationResults.length === 0 ? (
                            <p className="italic text-muted-foreground">Ei tuloksia.</p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Pelaaja</TableHead>
                                  <TableHead className="text-right">Pisteet</TableHead>
                                  <TableHead className="text-right">Tyyli ✨</TableHead>
                                  <TableHead className="text-right">Yht.</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {stationResults.map((row) => (
                                  <TableRow key={row.user_id}>
                                    <TableCell className="font-medium">{row.display_name}</TableCell>
                                    <TableCell className="text-right">{row.points}</TableCell>
                                    <TableCell className="text-right">{row.style_points}</TableCell>
                                    <TableCell className="text-right font-bold">{row.total}</TableCell>
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
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Kokonaistulokset (kaikki kisat) 🏆</CardTitle></CardHeader>
        <CardContent>
          {overall.length === 0 ? (
            <p className="italic text-muted-foreground">Ei tuloksia vielä.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">Sija</TableHead>
                  <TableHead>Pelaaja</TableHead>
                  <TableHead className="text-right">Yht.</TableHead>
                  <TableHead className="text-right">Kisoja</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overall.map((row, i) => (
                  <TableRow key={row.user_id} className={i === 0 ? "bg-primary/10" : ""}>
                    <TableCell>{medals[i] ?? i + 1}</TableCell>
                    <TableCell className="font-medium">{row.display_name}</TableCell>
                    <TableCell className="text-right font-bold">{row.total}</TableCell>
                    <TableCell className="text-right">{row.competitions}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
