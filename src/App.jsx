import { useState, useMemo } from "react";
import "./App.css";
import { defaultStations } from "./data";
import { usePersistentState, clearAllPersistedState } from "./usePersistentState";
import RegisterTab from "./components/RegisterTab";
import CompetitionTab from "./components/CompetitionTab";
import StatsTab from "./components/StatsTab";
import AdminBar from "./components/AdminBar";

const ADMIN_PIN = "1234";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [players, setPlayers] = usePersistentState("players", []);
  const [stations, setStations] = usePersistentState("stations", defaultStations);
  const [currentStationIndex, setCurrentStationIndex] = usePersistentState("currentStationIndex", 0);
  // scores[stationId][playerId] = { points: number, style: number }
  const [scores, setScores] = usePersistentState("scores", {});
  const [discordWebhookUrl, setDiscordWebhookUrl] = usePersistentState("discordWebhookUrl", "");
  const [isAdmin, setIsAdmin] = usePersistentState("isAdmin", false);
  const [tab, setTab] = useState("register");

  const currentStation = stations[currentStationIndex] ?? null;

  function addPlayer(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPlayers((prev) => [...prev, { id: makeId(), name: trimmed }]);
  }

  function removePlayer(id) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  function setScore(stationId, playerId, field, value) {
    setScores((prev) => {
      const stationScores = { ...(prev[stationId] ?? {}) };
      const playerScore = { points: 0, style: 0, ...(stationScores[playerId] ?? {}) };
      playerScore[field] = value;
      stationScores[playerId] = playerScore;
      return { ...prev, [stationId]: stationScores };
    });
  }

  function tryAdminLogin() {
    if (isAdmin) {
      setIsAdmin(false);
      return;
    }
    const pin = window.prompt("Admin-PIN:");
    if (pin === ADMIN_PIN) {
      setIsAdmin(true);
    } else if (pin !== null) {
      alert("Väärä PIN.");
    }
  }

  function approveAndAdvance() {
    if (currentStationIndex < stations.length - 1) {
      setCurrentStationIndex((i) => i + 1);
      setTab("competition");
    } else {
      alert("Tämä oli viimeinen rasti! Kisat ohi 🎉");
    }
  }

  function goToStation(index) {
    setCurrentStationIndex(index);
  }

  function addStation(name, description) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setStations((prev) => [...prev, { id: makeId(), name: trimmed, description: description.trim() }]);
  }

  function removeStation(id) {
    setStations((prev) => prev.filter((s) => s.id !== id));
  }

  async function postToDiscord(content, { mentionEveryone = false } = {}) {
    if (!discordWebhookUrl) {
      alert("Discord-webhook ei ole asetettu. Aseta se admin-tilassa Rekisteröinti-välilehdellä.");
      return false;
    }
    try {
      const res = await fetch(discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          allowed_mentions: { parse: mentionEveryone ? ["everyone"] : [] },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch (err) {
      alert("Discordiin jakaminen epäonnistui: " + err.message);
      return false;
    }
  }

  function shareStationToDiscord(station) {
    const stationScores = scores[station.id] ?? {};
    const lines = players.map((p) => {
      const s = stationScores[p.id] ?? { points: 0, style: 0 };
      const pts = Number(s.points) || 0;
      const sty = Number(s.style) || 0;
      return `**${p.name}**: ${pts} pistettä, ${sty} tyylipistettä (yht. ${pts + sty})`;
    });
    const content = `📣 **${station.name}** tulokset:\n${lines.join("\n") || "Ei tuloksia."}`;
    return postToDiscord(content);
  }

  function sendKickoffAnnouncement() {
    return postToDiscord("@everyone KESÄKISAT ALKAA KOHTA 🏆☀️", { mentionEveryone: true });
  }

  function shareStandingsToDiscord() {
    const sorted = [...totals].sort((a, b) => b.total - a.total);
    const medals = ["🥇", "🥈", "🥉"];
    const lines = sorted.map((row, i) => {
      const medal = medals[i] ?? `${i + 1}.`;
      return `${medal} **${row.name}** — ${row.total} p. (${row.points} pistettä + ${row.style} tyyliä)`;
    });
    const content = `🏆 **Kesäkisojen tilanne:**\n${lines.join("\n") || "Ei osallistujia."}`;
    return postToDiscord(content);
  }

  function resetAll() {
    if (!window.confirm("Nollataanko kaikki osallistujat, pisteet ja rastien tila? Tätä ei voi perua.")) return;
    setPlayers([]);
    setStations(defaultStations);
    setCurrentStationIndex(0);
    setScores({});
    clearAllPersistedState();
    setIsAdmin(false);
    setTab("register");
  }

  const totals = useMemo(() => {
    const map = {};
    for (const p of players) {
      map[p.id] = { playerId: p.id, name: p.name, points: 0, style: 0, total: 0 };
    }
    for (const station of stations) {
      const stationScores = scores[station.id] ?? {};
      for (const p of players) {
        const s = stationScores[p.id] ?? { points: 0, style: 0 };
        const pts = Number(s.points) || 0;
        const sty = Number(s.style) || 0;
        if (!map[p.id]) continue;
        map[p.id].points += pts;
        map[p.id].style += sty;
        map[p.id].total += pts + sty;
      }
    }
    return Object.values(map);
  }, [players, stations, scores]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>☀️ Allun Kesäkisat 🏆</h1>
        <AdminBar isAdmin={isAdmin} onToggleAdmin={tryAdminLogin} onResetAll={resetAll} />
      </header>

      <nav className="tabs">
        <button className={tab === "register" ? "active" : ""} onClick={() => setTab("register")}>
          👥 Rekisteröinti
        </button>
        <button className={tab === "competition" ? "active" : ""} onClick={() => setTab("competition")}>
          🏁 Kisa
        </button>
        <button className={tab === "stats" ? "active" : ""} onClick={() => setTab("stats")}>
          📊 Tilastot
        </button>
      </nav>

      <main className="tab-content">
        {tab === "register" && (
          <RegisterTab
            players={players}
            onAddPlayer={addPlayer}
            onRemovePlayer={removePlayer}
            isAdmin={isAdmin}
            stations={stations}
            onAddStation={addStation}
            onRemoveStation={removeStation}
            discordWebhookUrl={discordWebhookUrl}
            onSetDiscordWebhookUrl={setDiscordWebhookUrl}
            onSendKickoffAnnouncement={sendKickoffAnnouncement}
          />
        )}
        {tab === "competition" && (
          <CompetitionTab
            players={players}
            stations={stations}
            currentStation={currentStation}
            currentStationIndex={currentStationIndex}
            scores={scores}
            setScore={setScore}
            isAdmin={isAdmin}
            onApproveAndAdvance={approveAndAdvance}
            onGoToStation={goToStation}
            onShareToDiscord={shareStationToDiscord}
            discordWebhookUrl={discordWebhookUrl}
          />
        )}
        {tab === "stats" && (
          <StatsTab
            players={players}
            stations={stations}
            scores={scores}
            totals={totals}
            discordWebhookUrl={discordWebhookUrl}
            onShareStandings={shareStandingsToDiscord}
          />
        )}
      </main>
    </div>
  );
}
