import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../../components/layout/PageLayout'
import { useAuditLogs } from './hooks/useAudit'
import type { AuditAction, AuditLogResponseDto, AuditLogListParams } from '../../types'
import { Download, Search } from 'lucide-react'

const ACTIONS: AuditAction[] = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'IMPORT', 'EXPORT']
const ENTITES = ['Client', 'Commande', 'Collecte', 'User', 'Facture']

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function initials(nom?: string, prenom?: string) {
  const a = (prenom?.[0] ?? '').toUpperCase()
  const b = (nom?.[0] ?? '').toUpperCase()
  return (a + b) || '—'
}

function actionBadge(action: AuditAction) {
  const map: Record<AuditAction, string> = {
    CREATE: 'bg-emerald-100 text-emerald-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
    LOGIN: 'bg-slate-100 text-slate-600',
    IMPORT: 'bg-amber-100 text-amber-700',
    EXPORT: 'bg-indigo-100 text-indigo-700',
  }
  return map[action] ?? 'bg-slate-100 text-slate-600'
}

export function AuditPage() {
  const navigate = useNavigate()
  const [params, setParams] = useState<AuditLogListParams>({
    page: 1,
    limit: 7,
    userId: undefined,
    action: undefined,
    entite: undefined,
    dateDebut: undefined,
    dateFin: undefined,
  })
  const [dateRange, setDateRange] = useState('')

  const { data, isLoading } = useAuditLogs(params)

  const items = useMemo(() => data?.items ?? [], [data?.items])
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  const from = ((params.page ?? 1) - 1) * (params.limit ?? 10) + 1
  const to = Math.min((params.page ?? 1) * (params.limit ?? 10), total)

  const handleDateFilter = () => {
    const [d1, d2] = dateRange.split('—').map(s => s.trim())
    setParams(p => ({
      ...p,
      dateDebut: d1 || undefined,
      dateFin: d2 || undefined,
      page: 1,
    }))
  }

  const users = useMemo(() => {
    const map = new Map<string, { id: string; nom?: string; prenom?: string }>()
    items.forEach((i) => {
      const u = i.user
      if (u && !map.has(u.id)) map.set(u.id, u)
    })
    return Array.from(map.values())
  }, [items])

  return (
    <PageLayout title="Audit Trail">
      <div className="p-8 max-w-7xl mx-auto space-y-6">

        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Historique d&apos;Audit</h2>
            <p className="text-slate-500 mt-1">Surveillez toutes les activités et modifications du système.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold transition-all shadow-sm">
            <Download size={16} />
            Exporter CSV
          </button>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Utilisateur</label>
            <select
              value={params.userId ?? ''}
              onChange={(e) => setParams(p => ({ ...p, userId: e.target.value || undefined, page: 1 }))}
              className="w-full rounded-lg border-slate-200 focus:ring-[#2563EB] focus:border-[#2563EB] text-sm py-2.5"
            >
              <option value="">Tous les utilisateurs</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.prenom ?? ''} {u.nom ?? ''}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Toutes les actions</label>
            <select
              value={params.action ?? ''}
              onChange={(e) => setParams(p => ({ ...p, action: (e.target.value as AuditAction) || undefined, page: 1 }))}
              className="w-full rounded-lg border-slate-200 focus:ring-[#2563EB] focus:border-[#2563EB] text-sm py-2.5"
            >
              <option value="">Toutes les actions</option>
              {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Toutes les entités</label>
            <select
              value={params.entite ?? ''}
              onChange={(e) => setParams(p => ({ ...p, entite: e.target.value || undefined, page: 1 }))}
              className="w-full rounded-lg border-slate-200 focus:ring-[#2563EB] focus:border-[#2563EB] text-sm py-2.5"
            >
              <option value="">Toutes les entités</option>
              {ENTITES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Période</label>
            <input
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              placeholder="Date début — Fin"
              className="w-full rounded-lg border-slate-200 focus:ring-[#2563EB] focus:border-[#2563EB] text-sm py-2.5"
            />
          </div>
          <button
            onClick={handleDateFilter}
            className="bg-[#2563EB] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md shadow-blue-200/30"
          >
            <Search size={16} />
            Filtrer
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Date / Heure', 'Utilisateur', 'Action', 'Entité', 'Résumé modification', ''].map((h) => (
                  <th key={h} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Chargement...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Aucun log</td></tr>
              ) : items.map((log: AuditLogResponseDto) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/audit/${log.id}`)}
                >
                  <td className="px-6 py-4 text-slate-600 font-medium">{formatDateTime(log.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {initials(log.user?.nom, log.user?.prenom)}
                      </div>
                      <span className="text-slate-800 font-medium">
                        {(log.user?.prenom ?? '')} {(log.user?.nom ?? '') || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${actionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-tight">
                      {log.entite}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 truncate max-w-xs">
                    {log.description ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400">›</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500 font-medium">
              {total > 0 ? `Affichage de ${from} à ${to} sur ${total} logs au total` : 'Aucun log'}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page = i + 1
                if (totalPages > 5 && (params.page ?? 1) > 3) {
                  page = (params.page ?? 1) - 2 + i
                }
                if (page > totalPages) return null
                return (
                  <button
                    key={page}
                    onClick={() => setParams(p => ({ ...p, page }))}
                    className={`px-3 py-1.5 rounded-md border text-sm font-medium ${
                      page === (params.page ?? 1)
                        ? 'bg-white border-slate-300 text-[#2563EB] font-bold shadow-sm'
                        : 'border-slate-300 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl flex gap-4">
          <span className="text-amber-600 shrink-0 text-3xl">👁️</span>
          <div>
            <h4 className="text-amber-800 font-bold mb-1">Accès Restreint : Directeur Uniquement</h4>
            <p className="text-amber-700 leading-relaxed text-sm">
              Cette interface contient les journaux d&apos;activité critiques. Toutes les actions de consultation sont elles-mêmes enregistrées dans la piste d&apos;audit pour assurer une conformité maximale.
            </p>
          </div>
        </div>

      </div>
    </PageLayout>
  )
}
