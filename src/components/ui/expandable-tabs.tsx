import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../../lib/utils";
import { LucideIcon } from "lucide-react";

interface Tab {
  title: string;
  icon: LucideIcon;
  type?: never;
  path?: string;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
  path?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  activeColor?: string;
  activeIndex?: number | null;
  onChange?: (index: number | null) => void;
}

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
  },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "1rem" : ".5rem",
    paddingRight: isSelected ? "1rem" : ".5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.05, type: "spring", bounce: 0, duration: 0.4 };

export function ExpandableTabs({
  tabs,
  className,
  activeColor = "text-brand-black",
  activeIndex,
  onChange,
}: ExpandableTabsProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onChange?.(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onChange]);

  const SeparatorEl = () => (
    <div className="mx-1 h-6 w-px bg-brand-border" aria-hidden="true" />
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-2xl border border-brand-border bg-white/80 backdrop-blur-sm p-1 shadow-sm",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <SeparatorEl key={`sep-${index}`} />;
        }

        const Icon = tab.icon;
        const isSelected = activeIndex === index;

        return (
          <motion.button
            key={tab.title}
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={isSelected}
            onClick={() => onChange?.(index)}
            transition={transition}
            className={cn(
              "relative flex items-center rounded-xl py-2.5 text-sm font-bold transition-colors duration-200",
              isSelected
                ? cn("bg-brand-black text-white shadow-md", activeColor === "text-brand-black" ? "text-white" : activeColor)
                : "text-brand-black/50 hover:bg-brand-gray hover:text-brand-black"
            )}
          >
            <Icon size={18} />
            <AnimatePresence initial={false}>
              {isSelected && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="overflow-hidden whitespace-nowrap text-xs"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
