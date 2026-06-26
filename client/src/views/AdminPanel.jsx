import { useEffect, useState } from "react";
import { Megaphone, Save } from "lucide-react";
import { api } from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminPanel() {
  const [webhook, setWebhook] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/admin/settings").then((s) => setWebhook(s.discordWebhookUrl || ""));
  }, []);

  async function saveWebhook(e) {
    e.preventDefault();
    setMsg("");
    try { await api.put("/admin/settings", { discordWebhookUrl: webhook.trim() }); setMsg("Tallennettu ✓"); }
    catch (err) { setMsg(err.message); }
  }

  async function sendKickoff() {
    try {
      await api.post("/admin/discord/announce", {
        message: "@everyone KESÄKISAT ALKAA KOHTA 🏆☀️", mentionEveryone: true,
      });
      alert("Ilmoitus lähetetty Discordiin!");
    } catch (err) { alert(err.message); }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Hallintapaneeli</CardTitle>
          <p className="text-sm text-muted-foreground">
            Discord-webhook tallentuu palvelimelle (ei näy selaimessa). Kaikki Discord-jaot käyttävät tätä.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form onSubmit={saveWebhook} className="flex flex-col gap-3">
            <Input placeholder="https://discord.com/api/webhooks/..." value={webhook}
              onChange={(e) => setWebhook(e.target.value)} />
            {msg && <p className="text-sm text-emerald-400">{msg}</p>}
            <Button type="submit" className="w-full"><Save className="size-4" /> Tallenna webhook</Button>
          </form>
          {webhook && (
            <Button variant="secondary" onClick={sendKickoff}>
              <Megaphone className="size-4" /> Lähetä "Kesäkisat alkaa kohta"
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
