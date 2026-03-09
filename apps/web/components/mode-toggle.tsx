"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 p-1">
        <Button variant="ghost" className="w-full justify-start" onClick={() => setTheme("light")}>
          Light
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={() => setTheme("dark")}>
          Dark
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={() => setTheme("system")}>
          System
        </Button>
      </PopoverContent>
    </Popover>
  );
}
