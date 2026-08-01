import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        // Use [color:] arbitrary values — these are always generated and beat cascade from body
        default:
          "bg-primary [color:#ffffff] shadow-sm hover:opacity-90",
        destructive:
          "bg-error [color:#ffffff] shadow-sm hover:opacity-90",
        outline:
          "border border-outline-variant bg-surface [color:#000000] hover:bg-surface-container-low transition-colors",
        secondary:
          "bg-secondary [color:#ffffff] shadow-sm hover:opacity-90",
        ghost:
          "hover:bg-surface-container-low [color:#000000]",
        link:
          "[color:#000000] underline-offset-4 hover:underline",
      },
      size: {
        default: "py-md px-xl text-body-lg",
        sm: "px-lg py-sm text-body-sm",
        lg: "py-lg px-xl text-body-lg",
        icon: "h-9 w-9",
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
