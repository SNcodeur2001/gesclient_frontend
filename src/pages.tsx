import { PageLayout } from './components/layout/PageLayout'
export { DashboardPage } from './features/dashboard/DashboardPage'
export {ClientsListPage} from './features/clients/ClientsListPage'
export { ClientFormPage } from './features/clients/ClientFormPage'
export {ClientDetailPage} from './features/clients/ClientDetailPage'
// Composant générique pour les pages en cours de développement
function ComingSoon({ title }: { title: string }) {
  return (
    <PageLayout title={title}>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚧</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-700 mb-1">{title}</h2>
          <p className="text-sm text-slate-400">Page en cours de développement</p>
        </div>
      </div>
    </PageLayout>
  )
}

// export const ClientsListPage    = () => <ComingSoon title="Liste des Clients" />
// export const ClientDetailPage   = () => <ComingSoon title="Détail Client" />
// export const ClientFormPage     = () => <ComingSoon title="Gestion des Clients" />
export const ClientImportPage   = () => <ComingSoon title="Importer des Clients" />
export const CommandesListPage  = () => <ComingSoon title="Liste des Commandes" />
export const CommandeDetailPage = () => <ComingSoon title="Détail Commande" />
export const CommandeNewPage    = () => <ComingSoon title="Nouvelle Commande" />
export const CollectesListPage  = () => <ComingSoon title="Liste des Collectes" />
export const CollecteDetailPage = () => <ComingSoon title="Détail de la Collecte" />
export const CollecteNewPage    = () => <ComingSoon title="Nouvelle Collecte" />
export const FacturesListPage   = () => <ComingSoon title="Liste des Factures" />
export const FactureDetailPage  = () => <ComingSoon title="Aperçu Facture" />
export const NotificationsPage  = () => <ComingSoon title="Notifications" />
export const AuditPage          = () => <ComingSoon title="Audit Trail" />
export const ProfilPage         = () => <ComingSoon title="Mon Profil" />