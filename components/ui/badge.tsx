import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        launch: "border-transparent bg-emerald-500/15 text-emerald-400",
        feature: "border-transparent bg-sky-500/15 text-sky-400",
        noise: "border-transparent bg-zinc-500/15 text-zinc-400",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
