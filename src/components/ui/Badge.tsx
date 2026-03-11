import { clsx } from 'clsx'

type BadgeVariant =
  | 'DIRECTEUR' | 'COMMERCIAL' | 'COLLECTEUR'
  | 'ACTIF' | 'PROSPECT' | 'INACTIF'
  | 'APPORTEUR' | 'ACHETEUR'
  | 'EN_ATTENTE_ACOMPTE' | 'EN_PREPARATION' | 'PRETE' | 'FINALISEE'
  | 'SUR_PLACE' | 'A_DISTANCE'
  | 'PROFORMA' | 'DEFINITIVE'
  | 'GENEREE' | 'ENVOYEE' | 'TELECHARGE'
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'IMPORT' | 'EXPORT'
  | 'ACOMPTE' | 'SOLDE'

const variantStyles: Record<BadgeVariant, string> = {
  // Rôles
  DIRECTEUR:          'bg-blue-100 text-blue-700',
  COMMERCIAL:         'bg-green-100 text-green-700',
  COLLECTEUR:         'bg-orange-100 text-orange-700',
  // Statut client
  ACTIF:              'bg-green-100 text-green-700',
  PROSPECT:           'bg-amber-100 text-amber-700',
  INACTIF:            'bg-gray-100 text-gray-500',
  // Type client
  APPORTEUR:          'bg-teal-100 text-teal-700',
  ACHETEUR:           'bg-blue-100 text-blue-700',
  // Statut commande
  EN_ATTENTE_ACOMPTE: 'bg-amber-100 text-amber-700',
  EN_PREPARATION:     'bg-blue-100 text-blue-700',
  PRETE:              'bg-purple-100 text-purple-700',
  FINALISEE:          'bg-green-100 text-green-700',
  // Type commande
  SUR_PLACE:          'bg-sky-100 text-sky-700',
  A_DISTANCE:         'bg-violet-100 text-violet-700',
  // Type facture
  PROFORMA:           'bg-gray-100 text-gray-600',
  DEFINITIVE:         'bg-green-100 text-green-700',
  // Statut facture
  GENEREE:            'bg-gray-100 text-gray-500',
  ENVOYEE:            'bg-blue-100 text-blue-700',
  TELECHARGE:         'bg-gray-100 text-gray-500',
  // Audit actions
  CREATE:             'bg-green-100 text-green-700',
  UPDATE:             'bg-blue-100 text-blue-700',
  DELETE:             'bg-red-100 text-red-600',
  LOGIN:              'bg-gray-100 text-gray-500',
  IMPORT:             'bg-purple-100 text-purple-700',
  EXPORT:             'bg-indigo-100 text-indigo-700',
  // Paiement
  ACOMPTE:            'bg-blue-100 text-blue-700',
  SOLDE:              'bg-green-100 text-green-700',
}

interface BadgeProps {
  variant: BadgeVariant
  label?: string
  className?: string
}

export function Badge({ variant, label, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {label ?? variant}
    </span>
  )
}