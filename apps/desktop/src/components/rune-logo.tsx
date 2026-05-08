import type * as React from "react";

import { cn } from "@/lib/utils";

type RuneLogoProps = React.ComponentProps<"svg"> & {
  backgroundColor?: string;
  borderColor?: string;
  cornerRadius?: number;
  markColor?: string;
  size?: React.ComponentProps<"svg">["width"];
};

export function RuneLogo({
  backgroundColor = "#15131F",
  borderColor = "#2A2438",
  className,
  cornerRadius = 20,
  markColor = "currentColor",
  size = 72,
  strokeWidth = 5,
  width = size,
  height = size,
  ...props
}: RuneLogoProps) {
  return (
    <svg
      {...props}
      width={width}
      height={height}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 text-yellow-500", className)}
    >
      <rect x="16" y="16" width="96" height="96" rx={cornerRadius} fill={backgroundColor} />
      <rect
        x="16.5"
        y="16.5"
        width="95"
        height="95"
        rx={Math.max(cornerRadius - 0.5, 0)}
        stroke={borderColor}
      />

      <path
        d="M52 90V38L78 56L52 70L82 90"
        stroke={markColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
