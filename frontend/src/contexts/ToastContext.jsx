import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const toast = useCallback(
    (message, type = 'success') => {
      const id = `${Date.now()}-${Math.random()}`
      setToasts((current) => [...current, { id, message, type }])
      window.setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" role="status" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={`toast toast--${item.type}`}>
            {item.type === 'error' ? (
              <XCircle size={18} />
            ) : item.type === 'info' ? (
              <Info size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}
            <span>{item.message}</span>
            <button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider')
  }

  return context
}
