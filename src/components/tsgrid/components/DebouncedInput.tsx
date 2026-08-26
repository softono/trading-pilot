"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DebouncedInputProps {
  value: string;
  onCommit: (v: string) => void;
  delay?: number;
  className?: string;
  placeholder?: string;
}

export function DebouncedInput({
  value,
  onCommit,
  delay = 400,
  className,
  placeholder,
}: DebouncedInputProps) {
  const [local, setLocal] = useState(value);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing controlled value to local debounce state
  useEffect(() => setLocal(value), [value]);

  useEffect(() => {
    if (local === value) return;
    const t = setTimeout(() => onCommit(local), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="h-9 pl-8 pr-8"
      />
      {local && (
        <button
          type="button"
          onClick={() => {
            setLocal("");
            onCommit("");
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
