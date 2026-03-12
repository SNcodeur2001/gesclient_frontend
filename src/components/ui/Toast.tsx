import { useToastStore, type ToastType } from '../../store/toastStore'
import { CheckCircle, XCircle, AlertCircle, X, Info } from 'lucide-react'

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={20} className="text-green-500" />,
  error: <XCircle size={20} className="text-red-500" />,
  warning: <AlertCircle size={20} className="text-amber-500" />,
  info: <Info size={20} className="text-blue-500" />,
}

const bgMap: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
  info: 'bg-blue-50 border-blue-200',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-5 py-4 rounded-lg border shadow-xl min-w-[320px] max-w-[420px] animate-slide-in ${bgMap[toast.type]}`}
        >
          {iconMap[toast.type]}
          <p className="flex-1 text-sm font-medium text-slate-800">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  )
}
