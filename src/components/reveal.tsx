import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Direction the element travels in while fading in. */
  direction?: "up" | "down" | "left" | "right" | "none";
  /** Delay in ms (e.g. 120). Useful for staggering siblings. */
  delay?: number;
  /** Optional wrapper element (defaults to `div`). */
  as?: "div" | "section" | "article" | "li" | "header";
};

const DIRECTION_TRANSLATE: Record<NonNullable<RevealProps["direction"]>, string> = {
  up: "-translate-y-6",
  down: "translate-y-6",
  left: "translate-x-6",
  right: "-translate-x-6",
  none: "",
};

export function Reveal({ children, className, direction = "up", delay = 0, as: Tag = "div" }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <Tag
      ref={ref as never}
      className={cn(
        "will-change-[opacity,transform,filter] transition-all duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
        inView
          ? "translate-x-0 translate-y-0 opacity-100 blur-none"
          : cn("opacity-0 blur-[6px]", DIRECTION_TRANSLATE[direction]),
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
