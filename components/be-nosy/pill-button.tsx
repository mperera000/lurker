import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const pillClassName =
  "inline-flex h-[59px] min-w-[153px] items-center justify-center rounded-[21px] bg-[rgba(231,70,93,0.74)] px-6 font-be-mono text-[29px] font-normal tracking-[-0.06em] text-black transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50";

export function PillButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(pillClassName, className)} {...props} />;
}
