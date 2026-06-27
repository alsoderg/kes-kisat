import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

function Tabs({ className, ...props }) {
  return <TabsPrimitive.Root className={cn("flex flex-col gap-4", className)} {...props} />;
}

function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-11 w-full items-center justify-stretch gap-1 rounded-xl bg-card/70 p-1 text-muted-foreground backdrop-blur",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium whitespace-nowrap transition-all cursor-pointer",
        "focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none",
        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }) {
  return <TabsPrimitive.Content className={cn("outline-none", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
