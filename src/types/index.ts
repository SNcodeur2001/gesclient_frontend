// ─── Enums ────────────────────────────────────────────────────────────────────

export type Role = 'DIRECTEUR' | 'COMMERCIAL' | 'COLLECTEUR'

export type ClientType = 'APPORTEUR' | 'ACHETEUR'

export type ClientStatut = 'ACTIF' | 'PROSPECT' | 'INACTIF'

export type CommandeType = 'SUR_PLACE' | 'A_DISTANCE'

export type CommandeStatut =
  | 'EN_ATTENTE_ACOMPTE'
  | 'EN_PREPARATION'
  | 'PRETE'
  | 'FINALISEE'

export type PaiementType = 'ACOMPTE' | 'SOLDE'

export type ModePaiement = 'ESPECES' | 'VIREMENT' | 'CHEQUE' | 'MOBILE_MONEY'

export type FactureType = 'PROFORMA' | 'DEFINITIVE'

export type FactureStatut = 'GENEREE' | 'ENVOYEE' | 'TELECHARGE'

export type NotificationType =
  | 'NOUVELLE_COLLECTE'
  | 'ACOMPTE_RECU'
  | 'COMMANDE_PRETE'
  | 'COMMANDE_FINALISEE'
  | 'IMPORT_TERMINE'
  | 'COMMANDE_EN_ATTENTE'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'IMPORT'
  | 'EXPORT'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  nom: string
  prenom: string
  email: string
  role: Role
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  setAccessToken: (token: string) => void
  logout: () => void
}

export interface LoginDto {
  email: string
  password: string
}

export interface AuthResponseDto {
  access_token: string
  refresh_token: string
  user: User
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export interface AssignedUserDto {
  id: string
  nom: string
  prenom: string
  role: Role
}

export interface ClientResponseDto {
  id: string
  nom: string
  prenom: string | null
  email: string | null
  telephone: string | null
  adresse: string | null
  type: ClientType
  statut: ClientStatut
  totalRevenue: number
  notes: string | null
  createdAt: string
  updatedAt: string
  assignedTo?: AssignedUserDto
}

export interface CreateClientDto {
  nom: string
  prenom?: string
  email?: string
  telephone?: string
  adresse?: string
  notes?: string
  type?: ClientType
  statut?: ClientStatut
}

export type UpdateClientDto = Partial<CreateClientDto>

export interface ClientListParams {
  page?: number
  limit?: number
  search?: string
  type?: ClientType
  statut?: ClientStatut
}

// ─── Commandes ────────────────────────────────────────────────────────────────

export interface CommandeItemDto {
  produit: string
  quantite: number
  prixUnitaire: number
}

export interface CommandeItemResponse {
  id: string
  produit: string
  quantite: number
  prixUnitaire: number
}

export interface CreateCommandeDto {
  type: CommandeType
  acheteurId?: string
  acheteurInfo?: {
    nom: string
    email?: string
    telephone?: string
  }
  items?: CommandeItemDto[]
  produit?: string
  quantite?: number
  prixUnitaire?: number
}

export interface ChangeStatutDto {
  statut: CommandeStatut
}

export interface CommandeResponseDto {
  id: string
  reference: string
  type: CommandeType
  statut: CommandeStatut
  acheteurId: string
  acheteur: {
    id: string
    nom: string
    telephone?: string
  }
  produit?: string
  quantite?: number
  prixUnitaire?: number
  montantHT: number
  tva: number
  montantTTC: number
  acompteMinimum: number | null
  acompteVerse: number
  soldeRestant: number
  items?: CommandeItemResponse[]
  paiements?: PaiementResponse[]
  commercialId: string
  commercial: {
    id: string
    nom: string
    prenom: string
  }
  createdAt: string
  updatedAt: string
}

export interface CommandeListParams {
  page?: number
  limit?: number
  search?: string
  statut?: CommandeStatut
  type?: CommandeType
  dateDebut?: string
  dateFin?: string
}

// ─── Paiements ────────────────────────────────────────────────────────────────

export interface CreatePaiementDto {
  type: PaiementType
  montant: number
  modePaiement: ModePaiement
}

export interface PaiementResponse {
  id: string
  commandeId: string
  type: PaiementType
  montant: number
  modePaiement: ModePaiement
  valideParId: string
  validePar: {
    id: string
    nom: string
    prenom: string
  }
  createdAt: string
}

// ─── Collectes ────────────────────────────────────────────────────────────────

export interface CollecteItemDto {
  typePlastique: string
  quantiteKg: number
  prixUnitaire: number
}

export interface CollecteItemResponse {
  id: string
  typePlastique: string
  quantiteKg: number
  prixUnitaire: number
}

export interface CreateCollecteDto {
  apporteurId?: string
  apporteurInfo?: {
    nom: string
    telephone?: string
  }
  items?: CollecteItemDto[]
  quantiteKg?: number
  prixUnitaire?: number
  notes?: string
}

export interface CollecteResponseDto {
  id: string
  apporteurId: string
  apporteur: {
    id: string
    nom: string
    telephone?: string
  }
  quantiteKg: number | null
  prixUnitaire: number | null
  montantTotal: number
  notes: string | null
  collecteurId: string
  collecteur: {
    id: string
    nom: string
    prenom: string
  }
  items?: CollecteItemResponse[]
  createdAt: string
}

export interface CollecteListParams {
  page?: number
  limit?: number
  search?: string
  dateDebut?: string
  dateFin?: string
}

// ─── Factures ─────────────────────────────────────────────────────────────────

export interface FactureResponse {
  id: string
  numero: string
  type: FactureType
  commandeId: string
  montantHT: number
  tva: number
  montantTTC: number
  statut: FactureStatut
  envoyeeWhatsApp: boolean
  dateEnvoiWhatsApp?: string
  telephoneEnvoye?: string
  genereParId: string
  generePar: {
    id: string
    nom: string
    prenom: string
  }
  createdAt: string
  updatedAt: string
}

export interface FactureListResponse {
  data: FactureResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface NotificationResponseDto {
  id: string
  userId: string
  type: NotificationType
  message: string
  lu: boolean
  lien?: string
  clientId?: string
  commandeId?: string
  createdAt: string
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export interface AuditLogResponseDto {
  id: string
  userId: string
  user?: {
    id: string
    nom: string
    prenom: string
  }
  action: AuditAction
  entite: string
  entiteId: string
  ancienneValeur?: object
  nouvelleValeur?: object
  createdAt: string
}

export interface AuditLogListParams {
  page?: number
  limit?: number
  userId?: string
  action?: AuditAction
  entite?: string
  dateDebut?: string
  dateFin?: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardResponse {
  collecte: {
    tonnageMois: number
    montantMois: number
    variationMois: string
  }
  commercial: {
    chiffreAffairesMois: number
    commandesEnCours: number
    enAttenteAcompte: number
    variationMois: string
  }
  clients: {
    totalApporteurs: number
    totalAcheteurs: number
    nouveauxCeMois: number
  }
  topApporteurs: {
    id: string
    nom: string
    tonnage: number
    montant: number
  }[]
  topAcheteurs: {
    id: string
    nom: string
    chiffreAffaires: number
  }[]
  evolutionCollecte: {
    mois: string
    tonnage: number
  }[]
  evolutionCA: {
    mois: string
    montant: number
  }[]
}