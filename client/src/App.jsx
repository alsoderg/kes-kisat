import { useEffect, useState } from "react";
import { Flag, MapPin, BarChart3, User, Wrench, LogOut, LogIn, Sun, X } from "lucide-react";
import { useAuth } from "./auth.jsx";
import { useUrlParam } from "./useUrlState.js";
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
  const [tab, setTab] = useUrlParam("tab", "competitions");
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = user?.theme || "kesa";
  }, [user]);

  // Sulje kirjautumismodaali kun kirjautuminen onnistuu
  useEffect(() => {
    if (user) setShowAuth(false);
  }, [user]);

  if (loading) {
    return <div className="flex min-h-svh items-center justify-center text-muted-foreground">Ladataan…</div>;
  }

  // Sallitut tabit riippuvat kirjautumisesta; muuten pudota Kisoihin
  const allowed = new Set(["competitions", "events", "results"]);
  if (user) allowed.add("profile");
  if (user?.isAdmin) allowed.add("admin");
  const activeTab = allowed.has(tab) ? tab : "competitions";

  return (
    <div className="flex min-h-svh flex-col gap-5 p-4 sm:p-6">
      <header className="flex flex-col items-center gap-3 pt-2 text-center">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Sun className="size-6 text-primary" /> KesäkisApp
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {user ? (
            <>
              <span className="flex items-center gap-1.5">
                <User className="size-3.5" /> {user.displayName}
                {user.isAdmin && <Badge variant="secondary" className="ml-1">admin</Badge>}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="size-3.5" /> Ulos
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowAuth(true)}>
              <LogIn className="size-3.5" /> Kirjaudu
            </Button>
          )}
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setTab} className="w-full">
        <TabsList className="sticky top-3 z-10 shadow-lg shadow-black/20">
          <TabsTrigger value="competitions" aria-label="Kisat"><Flag /> <span className="hidden sm:inline">Kisat</span></TabsTrigger>
          <TabsTrigger value="events" aria-label="Rastit"><MapPin /> <span className="hidden sm:inline">Rastit</span></TabsTrigger>
          <TabsTrigger value="results" aria-label="Tulokset"><BarChart3 /> <span className="hidden sm:inline">Tulokset</span></TabsTrigger>
          {user && <TabsTrigger value="profile" aria-label="Profiili"><User /> <span className="hidden sm:inline">Profiili</span></TabsTrigger>}
          {user?.isAdmin && <TabsTrigger value="admin" aria-label="Admin"><Wrench /> <span className="hidden sm:inline">Admin</span></TabsTrigger>}
        </TabsList>

        <TabsContent value="competitions"><CompetitionsTab /></TabsContent>
        <TabsContent value="events"><EventsTab /></TabsContent>
        <TabsContent value="results"><ResultsTab /></TabsContent>
        {user && <TabsContent value="profile"><ProfileView /></TabsContent>}
        {user?.isAdmin && <TabsContent value="admin"><AdminPanel /></TabsContent>}
      </Tabs>

      {showAuth && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowAuth(false)}
        >
          <div className="relative w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowAuth(false)}
              className="absolute -top-2 -right-2 z-10 rounded-full bg-card p-1.5 text-muted-foreground shadow-lg hover:text-foreground cursor-pointer"
              aria-label="Sulje"
            >
              <X className="size-4" />
            </button>
            <AuthView onClose={() => setShowAuth(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
