"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

// Bare lys modus i v1 (DESIGN.md), så temaet er fast og next-themes brukes ikke.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          // Feiltoasten (destructive): kantlinje og ikon i destructive, men
          // teksten beholder forgrunnsfargen, så kontrasten er AA.
          error:
            "group-[.toaster]:border-destructive group-[.toaster]:border-2 [&_[data-icon]]:text-destructive",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
