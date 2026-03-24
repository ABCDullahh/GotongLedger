"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface-container-high group-[.toaster]:text-on-surface group-[.toaster]:border-outline-variant/20 group-[.toaster]:shadow-2xl group-[.toaster]:shadow-black/40",
          description: "group-[.toast]:text-outline",
          actionButton:
            "group-[.toast]:bg-primary-container group-[.toast]:text-on-primary-container",
          cancelButton:
            "group-[.toast]:bg-surface-container-highest group-[.toast]:text-outline",
          error:
            "group-[.toaster]:bg-destructive-container/30 group-[.toaster]:text-destructive group-[.toaster]:border-destructive/30",
          success:
            "group-[.toaster]:bg-secondary-container/30 group-[.toaster]:text-secondary group-[.toaster]:border-secondary/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
