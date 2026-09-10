"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn, initials } from "@/lib/utils";

function Avatar({
  className,
  name,
  hue,
  size = "md",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  name?: string;
  hue?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    xs: "size-6 text-[9px]",
    sm: "size-8 text-[11px]",
    md: "size-10 text-xs",
    lg: "size-12 text-sm",
    xl: "size-16 text-lg",
  } as const;
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn("relative flex size-10 shrink-0 overflow-hidden rounded-full", sizes[size], className)}
      {...props}
    >
      <AvatarPrimitive.Image className="aspect-square size-full" alt={name} />
      <AvatarPrimitive.Fallback
        className={cn(
          "flex size-full items-center justify-center rounded-full font-semibold",
        )}
        style={
          hue != null
            ? {
                background: `linear-gradient(135deg, hsl(${hue} 70% 88%), hsl(${(hue + 40) % 360} 65% 80%))`,
                color: `hsl(${hue} 55% 30%)`,
              }
            : undefined
        }
      >
        {name ? initials(name) : "?"}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export { Avatar };
