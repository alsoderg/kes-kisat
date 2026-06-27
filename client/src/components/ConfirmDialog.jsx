import { createContext, useCallback, useContext, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ConfirmContext = createContext(null);

// Käyttö: const confirm = useConfirm();
//   if (await confirm({ title, description, confirmLabel, variant: "destructive" })) { ... }
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null); // { options, resolve }

  const confirm = useCallback(
    (options) => new Promise((resolve) => setState({ options, resolve })),
    []
  );

  function close(result) {
    state?.resolve(result);
    setState(null);
  }

  const o = state?.options ?? {};
  const destructive = o.variant === "destructive";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => close(false)}
        >
          <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {destructive && <AlertTriangle className="size-5 text-destructive" />}
                {o.title ?? "Oletko varma?"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {o.description && <p className="text-sm text-muted-foreground">{o.description}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => close(false)}>
                  {o.cancelLabel ?? "Peruuta"}
                </Button>
                <Button variant={destructive ? "destructive" : "default"} onClick={() => close(true)}>
                  {o.confirmLabel ?? "Vahvista"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
