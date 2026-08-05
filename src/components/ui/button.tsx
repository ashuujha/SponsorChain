import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-black text-white hover:bg-gray-800 shadow-xs",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700",
        outline:
          "bg-transparent border border-black/20 text-black hover:border-black hover:bg-black/5",
        secondary:
          "bg-white border border-black/10 text-black hover:bg-gray-100 shadow-xs",
        ghost:
          "bg-transparent text-black/70 hover:text-black hover:bg-black/5",
        link:
          "text-black underline underline-offset-4 hover:opacity-75 p-0 h-auto font-medium",
      },
      size: {
        default: "px-7 py-2.5 h-[44px] text-base",
        sm: "px-5 py-2 h-[38px] text-sm",
        lg: "px-8 py-3.5 h-[52px] text-lg font-medium",
        icon: "h-10 w-10 p-0 rounded-full border border-black/20 text-black hover:bg-black/5",
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

