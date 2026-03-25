import { useNavigate, useParams } from 'react-router-dom'
import { PageLayout } from '../../components/layout/PageLayout'
import { useAuditLog } from './hooks/useAudit'
import type { AuditAction } from '../../types'
import {
  ArrowLeft, ShieldCheck, User, Calendar, FileText, Info,
} from 'lucide-react'

function formatDateTime(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function actionBadge(action?: AuditAction) {
  const map: Record<AuditAction, string> = {
    CREATE: 'bg-emerald-100 text-emerald-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    LOGIN: 'bg-slate-100 text-slate-600',
    IMPORT: 'bg-amber-100 text-amber-700',
    EXPORT: 'bg-indigo-100 text-indigo-700',
  }
  return map[action ?? 'LOGIN'] ?? 'bg-slate-100 text-slate-600'
}

function JsonBlock({ value }: { value?: object }) {
  if (!value) {
    return <span className="text-slate-400">—</span>
  }
  return (
    <pre className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="text-sm text-slate-700 text-right">{value}</div>
    </div>
  )
}

export function AuditDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: log, isLoading } = useAuditLog(id ?? '')

  if (isLoading) {
    return (
      <PageLayout title="Détail Audit">
        <div className="p-8 text-slate-400">Chargement...</div>
      </PageLayout>
    )
  }

  if (!log) {
    return (
      <PageLayout title="Détail Audit">
        <div className="p-8">
          <button
            onClick={() => navigate('/audit')}
            className="flex items-center gap-2 text-slate-500 hover:text-[#2563EB] text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Retour à l'audit
          </button>
          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6 text-slate-500">
            Log d&apos;audit introuvable.
          </div>
        </div>
      </PageLayout>
    )
  }

  const userLabel = log.user
    ? `${log.user.prenom ?? ''} ${log.user.nom ?? ''}`.trim()
    : log.userId

  return (
    <PageLayout title="Détail Audit">
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/audit')}
          className="flex items-center gap-2 text-slate-500 hover:text-[#2563EB] text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Retour à l&apos;audit
        </button>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-blue-50 flex items-center justify-center text-[#2563EB]">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Log d&apos;audit</h2>
                <p className="text-sm text-slate-500">ID: {log.id}</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${actionBadge(log.action)}`}>
              {log.action}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase">
                <User size={14} />
                Utilisateur
              </div>
              <InfoRow label="Nom" value={userLabel || '—'} />
              <InfoRow label="User ID" value={log.userId} />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase">
                <Calendar size={14} />
                Horodatage
              </div>
              <InfoRow label="Date/Heure" value={formatDateTime(log.createdAt)} />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase">
              <FileText size={14} />
              Cible
            </div>
            <InfoRow label="Entité" value={log.entite || '—'} />
            <InfoRow label="Entité ID" value={log.entiteId || '—'} />
            <InfoRow label="Description" value={log.description || '—'} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase">
                <Info size={14} />
                Ancienne valeur
              </div>
              <JsonBlock value={log.ancienneValeur} />
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase">
                <Info size={14} />
                Nouvelle valeur
              </div>
              <JsonBlock value={log.nouvelleValeur} />
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
