import { motion } from "framer-motion";
import { Home, Factory } from "lucide-react";

export type Segment = "household" | "business";

interface Props {
  value: Segment;
  onChange: (v: Segment) => void;
}

export function SegmentToggle({ value, onChange }: Props) {
  const isBusiness = value === "business";

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > 40) onChange("business");
    else if (info.offset.x < -40) onChange("household");
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(8);
  };

  return (
    <div className="w-full max-w-md mx-auto select-none">
      <div className="relative h-16 rounded-full bg-secondary/80 border border-border p-1.5 shadow-inner overflow-hidden">
        <motion.div
          className="absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] rounded-full brand-gradient shadow-lg"
          animate={{ x: isBusiness ? "100%" : "0%" }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
        />
        <div className="relative h-full grid grid-cols-2 z-10">
          <button
            type="button"
            onClick={() => onChange("household")}
            className={`flex items-center justify-center gap-2 rounded-full font-semibold transition-colors min-h-11 ${
              !isBusiness ? "text-white" : "text-muted-foreground"
            }`}
            aria-pressed={!isBusiness}
          >
            <Home className="w-5 h-5" /> Domácnosť
          </button>
          <button
            type="button"
            onClick={() => onChange("business")}
            className={`flex items-center justify-center gap-2 rounded-full font-semibold transition-colors min-h-11 ${
              isBusiness ? "text-white" : "text-muted-foreground"
            }`}
            aria-pressed={isBusiness}
          >
            <Factory className="w-5 h-5" /> Priemysel
          </button>
        </div>
      </div>
      <motion.p
        className="text-center text-xs text-muted-foreground mt-2"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        👉 potiahni alebo klikni na prepnutie
      </motion.p>
    </div>
  );
}
