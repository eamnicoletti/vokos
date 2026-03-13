"use client";

import React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LogoIcon } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Funcionalidades", href: "#funcionalidades" },
  { name: "Solução", href: "#solucao" },
  { name: "Planos", href: "#planos" },
  { name: "FAQ", href: "#faq" },
  { name: "Sobre", href: "#sobre" }
];

type HeroHeaderProps = {
  user: {
    email: string;
    name: string;
  } | null;
};

export const HeroHeader = ({ user }: HeroHeaderProps) => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header>
      <nav className="fixed z-20 w-full px-2">
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled && "bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link href="/" aria-label="home" className="flex items-center space-x-2">
                <LogoIcon />
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                data-state={menuState ? "active" : "inactive"}
                aria-label={menuState ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu
                  data-state={menuState ? "active" : "inactive"}
                  className="data-[state=active]:rotate-180 data-[state=active]:scale-0 data-[state=active]:opacity-0 m-auto size-6 duration-200"
                />
                <X
                  data-state={menuState ? "active" : "inactive"}
                  className="data-[state=active]:rotate-0 data-[state=active]:scale-100 data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200"
                />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item) => (
                  <li key={item.name}>
                    <a href={item.href} className="text-accent-foreground/80 dark:text-muted-foreground hover:text-accent-foreground block duration-150 text-accent-foreground/80">
                      <span>{item.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className={cn(
                "bg-background mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none",
                menuState && "block"
              )}
            >
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  <li>
                    {user ? (
                      <Link href="/dashboard" className="text-muted-foreground hover:text-accent-foreground block duration-150">
                        <span>Dashboard</span>
                      </Link>
                    ) : (
                      <Link href="/login" className="text-muted-foreground hover:text-accent-foreground block duration-150">
                        <span>Login</span>
                      </Link>
                    )}
                  </li>
                  {menuItems.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="text-muted-foreground hover:text-accent-foreground block duration-150">
                        <span>{item.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <div className={cn("hidden lg:block", isScrolled && "lg:hidden")}>
                  <ModeToggle />
                </div>
                {user ? (
                  <Button asChild variant="ghost" size="icon" className="hidden rounded-full lg:inline-flex">
                    <Link href="/dashboard" aria-label="Abrir dashboard">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>VK</AvatarFallback>
                      </Avatar>
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm" className="hidden pt-4 pb-[1.1rem] lg:inline-flex">
                    <Link href="/login">
                      <span>Login</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
