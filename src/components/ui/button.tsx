import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// 既然没有安装 @radix-ui/react-slot，我们先模拟一个简单的 Slot 或者直接用 button
// 为了保持简单，我先实现标准 button，后续如果有需要再引入 Slot

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-cyan-500 text-black hover:bg-cyan-400 border border-cyan-600 shadow-[0_0_10px_rgba(6,182,212,0.5)]",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 border border-red-700 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
        outline:
          "border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:text-cyan-400 text-zinc-300",
        secondary:
          "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-600",
        ghost: "hover:bg-zinc-800 hover:text-cyan-400 text-zinc-400",
        link: "text-cyan-500 underline-offset-4 hover:underline",
        cyber: "bg-transparent border border-cyan-500 text-cyan-500 hover:bg-cyan-950/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] clip-path-cyber",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // 简化版，不使用 Slot
    const Comp = "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
