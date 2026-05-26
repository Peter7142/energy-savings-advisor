import { motion } from "framer-motion";
import { Upload, Camera, Pencil } from "lucide-react";

export type Mode = "upload" | "photo" | "manual";

interface Props {
  value: Mode;
  onChange: (v: Mode) => void;
}

const OPTIONS: { v: Mode; label: string; Icon: typeof Upload }[] = [
  { v: "upload", label: "Nahrať", Icon: Upload },
  { v: "photo", label: "Odfotiť", Icon: Camera },
  { v: "manual", label: "Ručne", Icon: Pencil },
];

export function ModeToggle({ value, onChange }: Props) {
  const index = OPTIONS.findIndex((o) => o.v === value);

  return (
    <div className="w-full max-w-md mx-auto select-none">
      <div className="relative h-16 rounded-full bg-secondary/80 border border-border p-1.5 shadow-inner overflow-hidden">
        <motion.div
          className="absolute top-1.5 bottom-1.5 w-[calc(33.333%-0.5rem)] rounded-full brand-gradient shadow-lg"
          animate={{ x: `calc(${index * 100}% + ${index * 0.25}rem)` }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
        <div className="relative h-full grid grid-cols-3 z-10">
          {OPTIONS.map((o) => {
            const active = o.v === value;
            return (
              <button
                key={o.v}
                type="button"
                onClick={() => {
                  onChange(o.v);
                  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(8);
                }}
                className={`flex items-center justify-center gap-2 rounded-full font-semibold transition-colors min-h-11 text-sm ${
                  active ? "text-white" : "text-muted-foreground"
                }`}
                aria-pressed={active}
              >
                <o.Icon className="w-4 h-4" /> {o.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
