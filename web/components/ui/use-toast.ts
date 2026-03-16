import * as React from "react"

type ToastProps = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type ToastState = { toasts: ToastProps[] }
type Action =
  | { type: 'ADD_TOAST'; toast: ToastProps }
  | { type: 'REMOVE_TOAST'; toastId?: string }

let count = 0
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function reducer(state: ToastState, action: Action): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, 3) }
    case 'REMOVE_TOAST':
      return { ...state, toasts: action.toastId ? state.toasts.filter(t => t.id !== action.toastId) : [] }
  }
}

const listeners: Array<(state: ToastState) => void> = []
let memoryState: ToastState = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach(l => l(memoryState))
}

export function toast({ title, description }: { title?: string; description?: string }) {
  const id = String(++count)
  dispatch({ type: 'ADD_TOAST', toast: { id, title, description, open: true } })
  const timeout = setTimeout(() => dispatch({ type: 'REMOVE_TOAST', toastId: id }), 3000)
  toastTimeouts.set(id, timeout)
  return id
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)
  React.useEffect(() => {
    listeners.push(setState)
    return () => { const i = listeners.indexOf(setState); if (i > -1) listeners.splice(i, 1) }
  }, [])
  return { ...state, toast }
}
