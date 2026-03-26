"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@radix-ui/react-toast"
import { useToast } from "./use-toast"

export function Toaster() {
  const { toasts } = useToast()
  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className="flex items-start gap-3 rounded-xl border bg-card p-4 text-card-foreground shadow-lg">
            <div className="flex-1">
              {title && <ToastTitle className="text-sm font-semibold text-foreground">{title}</ToastTitle>}
              {description && <ToastDescription className="mt-1 text-sm text-muted-foreground">{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose className="text-muted-foreground hover:text-foreground" />
          </Toast>
        )
      })}
      <ToastViewport className="fixed bottom-4 right-4 z-50 flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2" />
    </ToastProvider>
  )
}
