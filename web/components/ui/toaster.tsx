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
          <Toast key={id} {...props} className="bg-white border border-gray-200 shadow-lg rounded-xl p-4 flex items-start gap-3">
            <div className="flex-1">
              {title && <ToastTitle className="text-sm font-semibold text-gray-900">{title}</ToastTitle>}
              {description && <ToastDescription className="text-sm text-gray-500 mt-1">{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose className="text-gray-400 hover:text-gray-600" />
          </Toast>
        )
      })}
      <ToastViewport className="fixed bottom-4 right-4 flex flex-col gap-2 w-96 z-50" />
    </ToastProvider>
  )
}
