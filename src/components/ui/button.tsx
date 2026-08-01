import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full font-mono text-xs uppercase tracking-[0.2em] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-transparent border border-white text-white hover:bg-white/10 shadow-xs",
        destructive:
          "bg-transparent border border-rose-500 text-rose-400 hover:bg-rose-950/30",
        outline:
          "bg-transparent border border-white/40 text-white/80 hover:border-white hover:text-white",
        secondary:
          "bg-[#141414] border border-[#3a3a3a] text-white hover:bg-[#1f1f1f]",
        ghost:
          "bg-transparent text-white/80 hover:text-white hover:bg-white/5",
        link:
          "text-[#c3d9f3] underline-offset-4 hover:underline p-0 h-auto font-mono text-xs uppercase tracking-[0.15em]",
      },
      size: {
        default: "px-8 py-3.5 h-[44px]",
        sm: "px-6 py-2.5 h-[38px] text-[11px]",
        lg: "px-10 py-4 h-[50px] text-[13px] tracking-[0.25em]",
        icon: "h-10 w-10 p-0 rounded-full border border-white/60 text-white hover:bg-white/10",
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
