import { cn } from "@/lib/utils";

function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-5 rounded-xl border border-border/70 py-5 shadow-lg shadow-black/20",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5 px-5", className)} {...props} />;
}

function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />;
}

function CardDescription({ className, ...props }) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function CardContent({ className, ...props }) {
  return <div className={cn("px-5", className)} {...props} />;
}

function CardFooter({ className, ...props }) {
  return <div className={cn("flex items-center px-5", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
