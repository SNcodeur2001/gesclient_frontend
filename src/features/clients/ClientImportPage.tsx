import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Download, UploadCloud, Info, CheckCircle,
} from 'lucide-react'
import { PageLayout } from '../../components/layout/PageLayout'
import { useImportClients, useDownloadClientsTemplate } from './hooks/useClients'
import type { ImportClientsResult } from '../../types'
import { useAuthStore } from '../../store/authStore'

export function ClientImportPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [result, setResult] = useState<ImportClientsResult | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const { user } = useAuthStore()
  const isDirecteur = user?.role === 'DIRECTEUR'

  const importMutation = useImportClients()
  const templateMutation = useDownloadClientsTemplate()

  const handleSelect = (f?: File | null) => {
    if (!f) return
    setFile(f)
  }

  const handleBrowse = () => inputRef.current?.click()

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    handleSelect(f)
  }

  const handleImport = async () => {
    if (!file || importMutation.isPending) return
    try {
      const res = await importMutation.mutateAsync(file)
      setResult(res)
      setFile(null)
    } catch {}
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await templateMutation.mutateAsync()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'clients-template.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  if (isDirecteur) {
    return (
      <PageLayout title="Gestion des Clients">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            Cette action n&apos;est pas disponible pour le rôle Directeur.
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Gestion des Clients">
      <div className="max-w-4xl mx-auto space-y-6">

        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-2 text-slate-500 hover:text-[#2563EB] transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Retour à la liste des clients
        </button>

        <div className="mb-4">
          <h2 className="text-3xl font-extrabold text-slate-900">Importer des clients</h2>
          <p className="text-slate-500 mt-1">
            Importez des clients en masse depuis un fichier Excel.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Étape 1 — Télécharger le modèle
          </h3>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex gap-4 items-start">
              <div className="bg-blue-50 p-3 rounded-full shrink-0 text-[#2563EB]">
                <Download size={18} />
              </div>
              <div>
                <p className="text-slate-700 leading-relaxed">
                  Téléchargez d&apos;abord le fichier modèle Excel pour respecter le format attendu.
                </p>
                <p className="text-xs text-slate-400 mt-2 font-medium">
                  Le modèle contient les colonnes : <span className="italic">Nom*, Prénom, Email, Téléphone, Adresse, Type*, Statut, Notes</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              disabled={templateMutation.isPending}
              className="shrink-0 flex items-center gap-2 border-2 border-[#2563EB] text-[#2563EB] hover:bg-blue-50 px-4 py-2 rounded-lg font-bold transition-all text-sm disabled:opacity-60"
            >
              <Download size={16} />
              Télécharger le modèle (.xlsx)
            </button>
          </div>
        </div>

        {!result && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Étape 2 — Importer votre fichier
            </h3>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors ${
                isDragging ? 'border-[#2563EB] bg-blue-50/60' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <UploadCloud size={28} className="text-slate-400" />
              </div>
              <p className="text-base font-bold text-slate-800">
                Glissez-déposez votre fichier Excel ici
              </p>
              <p className="text-sm text-slate-400 my-2">ou</p>
              <button
                onClick={handleBrowse}
                className="flex items-center gap-2 border-2 border-[#2563EB] text-[#2563EB] hover:bg-blue-50 px-6 py-2 rounded-lg font-bold transition-all text-sm mb-4"
              >
                Parcourir les fichiers
              </button>
              <p className="text-xs text-slate-400">
                Formats acceptés : .xlsx, .xls — Taille max : 10 MB
              </p>
              {file && (
                <p className="mt-3 text-xs text-slate-600">
                  Fichier sélectionné : <span className="font-semibold">{file.name}</span>
                </p>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleSelect(e.target.files?.[0])}
                className="hidden"
              />
            </div>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-emerald-500 p-6 shadow-sm overflow-hidden">
            <div className="flex items-start gap-4 mb-6">
              <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Importation terminée</h3>
                <p className="text-slate-500">Le fichier "{result.filename}" a été traité.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                <p className="text-emerald-700 font-bold text-xl">{result.validRows}</p>
                <p className="text-emerald-600 text-xs font-medium uppercase tracking-wider">clients créés</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-blue-700 font-bold text-xl">0</p>
                <p className="text-blue-600 text-xs font-medium uppercase tracking-wider">clients mis à jour</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                <p className="text-amber-700 font-bold text-xl">{result.invalidRows}</p>
                <p className="text-amber-600 text-xs font-medium uppercase tracking-wider">erreurs ignorées</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/clients')}
                className="px-5 py-2.5 bg-[#2563EB] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={14} />
                Retour à la liste
              </button>
              <button
                onClick={() => setShowErrors(v => !v)}
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                {showErrors ? 'Masquer le rapport' : 'Voir le rapport détaillé'}
              </button>
            </div>

            {showErrors && (
              <div className="mt-6 border-t border-slate-200 pt-4">
                {result.errors.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucune erreur détectée.</p>
                ) : (
                  <div className="space-y-2">
                    {result.errors.map((err, idx) => (
                      <div key={`${err.ligne}-${idx}`} className="text-sm text-slate-600">
                        Ligne {err.ligne} : {err.raison}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Info size={16} className="text-slate-400" />
            <h3 className="text-base font-bold text-slate-900">Règles d&apos;importation</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-slate-600 text-sm leading-relaxed">
              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
              Les clients existants avec le même email seront mis à jour avec les nouvelles informations du fichier.
            </li>
            <li className="flex items-start gap-3 text-slate-600 text-sm leading-relaxed">
              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
              Les champs marqués d&apos;un astérisque (*) sont obligatoires (Nom, Type).
            </li>
            <li className="flex items-start gap-3 text-slate-600 text-sm leading-relaxed">
              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
              Vous recevrez une notification <span className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded border border-slate-200">IMPORT_TERMINE</span> une fois le traitement fini.
            </li>
          </ul>
        </div>

        {!result && (
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
            <button
              onClick={() => navigate('/clients')}
              className="px-6 py-2.5 rounded-lg text-slate-500 hover:text-slate-700 font-bold transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleImport}
              disabled={!file || importMutation.isPending}
              className="flex items-center gap-2 bg-[#2563EB] text-white px-8 py-2.5 rounded-lg font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {importMutation.isPending ? 'Importation...' : "Lancer l'importation"}
            </button>
          </div>
        )}

      </div>
    </PageLayout>
  )
}
