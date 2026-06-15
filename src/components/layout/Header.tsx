"use client";

import { signOut, useSession } from "next-auth/react";
import { useMounted } from "@/hooks/use-mounted";
import { Bell, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data: session } = useSession();
  const mounted = useMounted();

  const displayName = mounted ? (session?.user?.name ?? "User") : "User";
  const userInitial = mounted ? (session?.user?.name?.[0]?.toUpperCase() ?? "U") : "U";
  const userImage = mounted ? session?.user?.image : undefined;

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <p className="font-semibold">{displayName}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>
        <ThemeToggle />
        {userImage ? (
          <img
            src={userImage}
            alt=""
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {userInitial}
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
