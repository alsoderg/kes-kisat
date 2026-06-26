import { useEffect, useState } from "react";
import { Flag, MapPin, BarChart3, User, Wrench, LogOut, Sun } from "lucide-react";
import { useAuth } from "./auth.jsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AuthView from "./views/AuthView.jsx";
import CompetitionsTab from "./views/CompetitionsTab.jsx";
import EventsTab from "./views/EventsTab.jsx";
import ResultsTab from "./views/ResultsTab.jsx";
import ProfileView from "./views/ProfileView.jsx";
import AdminPanel from "./views/AdminPanel.jsx";

export default function App() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState("competitions");

  useEffect(() => {
    document.documentElement.dataset.theme = user?.theme || "kesa";
  }, [user]);

  if (loading) {
    return <div className="flex min-h-svh items-center justify-center text-muted-foreground">Ladataan…</div>;
  }

  if (!user) return <AuthView />;

  return (
    <div className="flex min-h-svh flex-col gap-5 p-4 sm:p-6">
      <header className="flex flex-col items-center gap-3 pt-2 text-center">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Sun className="size-6 text-primary" /> KesäkisApp
        </h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="size-3.5" /> {user.displayName}
            {user.isAdmin && <Badge variant="secondary" className="ml-1">admin</Badge>}
          </span>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="size-3.5" /> Ulos
          </Button>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="sticky top-3 z-10 shadow-lg shadow-black/20">
          <TabsTrigger value="competitions"><Flag /> Kisat</TabsTrigger>
          <TabsTrigger value="events"><MapPin /> Rastit</TabsTrigger>
          <TabsTrigger value="results"><BarChart3 /> Tulokset</TabsTrigger>
          <TabsTrigger value="profile"><User /> Profiili</TabsTrigger>
          {user.isAdmin && <TabsTrigger value="admin"><Wrench /> Admin</TabsTrigger>}
        </TabsList>

        <TabsContent value="competitions"><CompetitionsTab /></TabsContent>
        <TabsContent value="events"><EventsTab /></TabsContent>
        <TabsContent value="results"><ResultsTab /></TabsContent>
        <TabsContent value="profile"><ProfileView /></TabsContent>
        {user.isAdmin && <TabsContent value="admin"><AdminPanel /></TabsContent>}
      </Tabs>
    </div>
  );
}
