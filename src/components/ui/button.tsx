import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aubergine disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-aubergine dark:bg-aubergine-press text-white shadow-sm hover:bg-aubergine-press dark:hover:bg-aubergine-tint",
        destructive:
          "bg-[#cc4117] text-white shadow-sm hover:opacity-90",
        outline:
          "border-2 border-aubergine dark:border-aubergine-mute bg-transparent text-aubergine dark:text-aubergine-mute hover:bg-aubergine/5 dark:hover:bg-aubergine/20",
        secondary:
          "bg-canvas-lavender dark:bg-surface-container text-ink dark:text-foreground hover:bg-canvas-cream dark:hover:bg-surface-hover",
        ghost:
          "hover:bg-canvas-cream dark:hover:bg-surface-container text-ink dark:text-foreground",
        link:
          "text-link-blue hover:text-link-blue-hover underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "px-7 py-3 text-[16px] leading-tight",
        sm: "px-5 py-2 text-[14px] leading-tight",
        lg: "px-8 py-4 text-[18px] leading-tight",
        icon: "h-10 w-10 p-0 rounded-full",
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
