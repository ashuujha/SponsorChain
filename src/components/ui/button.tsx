import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full font-mono text-xs uppercase tracking-[0.2em] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-transparent border border-foreground text-foreground hover:bg-foreground/10 shadow-xs",
        destructive:
          "bg-transparent border border-rose-500 text-rose-500 hover:bg-rose-500/10",
        outline:
          "bg-transparent border border-outline text-foreground hover:border-foreground hover:text-foreground",
        secondary:
          "bg-surface border border-hairline text-foreground hover:bg-surface-container",
        ghost:
          "bg-transparent text-foreground/80 hover:text-foreground hover:bg-foreground/5",
        link:
          "text-link underline-offset-4 hover:underline p-0 h-auto font-mono text-xs uppercase tracking-[0.15em]",
      },
      size: {
        default: "px-8 py-3.5 h-[44px]",
        sm: "px-6 py-2.5 h-[38px] text-[11px]",
        lg: "px-10 py-4 h-[50px] text-[13px] tracking-[0.25em]",
        icon: "h-10 w-10 p-0 rounded-full border border-foreground/60 text-foreground hover:bg-foreground/10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
