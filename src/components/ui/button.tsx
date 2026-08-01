import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-on-primary shadow-sm hover:opacity-90",
        destructive:
          "bg-error text-on-error shadow-sm hover:opacity-90",
        outline:
          "border border-outline-variant bg-surface text-foreground hover:bg-surface-container transition-colors",
        secondary:
          "bg-secondary text-on-secondary shadow-sm hover:opacity-90",
        ghost:
          "hover:bg-surface-container text-foreground",
        link:
          "text-foreground underline-offset-4 hover:underline",
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
