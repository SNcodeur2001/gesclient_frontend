import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AuthGuard } from '../features/auth/AuthGuard'
import { LoginPage } from '../features/auth/LoginPage'
import {
  DashboardPage,
  ClientsListPage, ClientDetailPage, ClientFormPage, ClientImportPage,
  CommandesListPage, CommandeDetailPage, CommandeNewPage,
  CollectesListPage, CollecteDetailPage, CollecteNewPage,
  FacturesListPage, FactureDetailPage,
  NotificationsPage,
  AuditPage,
  ProfilPage,
} from '../pages'

const router = createBrowserRouter([
  // Redirection racine
  { path: '/', element: <Navigate to="/dashboard" replace /> },

  // Login (public)
  { path: '/login', element: <LoginPage /> },

  // Routes protégées — tous les rôles
  {
    element: <AuthGuard />,
    children: [
      { path: '/dashboard',     element: <DashboardPage /> },
      { path: '/notifications', element: <NotificationsPage /> },
      { path: '/profil',        element: <ProfilPage /> },
    ],
  },

  // Routes protégées — DIRECTEUR + COMMERCIAL
  {
    element: <AuthGuard allowedRoles={['DIRECTEUR', 'COMMERCIAL']} />,
    children: [
      { path: '/clients',           element: <ClientsListPage /> },
      { path: '/clients/nouveau',   element: <ClientFormPage /> },
      { path: '/clients/import',    element: <ClientImportPage /> },
      { path: '/clients/:id',       element: <ClientDetailPage /> },
      { path: '/clients/:id/edit',  element: <ClientFormPage /> },
      { path: '/commandes',         element: <CommandesListPage /> },
      { path: '/commandes/nouveau', element: <CommandeNewPage /> },
      { path: '/commandes/:id',     element: <CommandeDetailPage /> },
    ],
  },

  // Routes protégées — DIRECTEUR + COLLECTEUR
  {
    element: <AuthGuard allowedRoles={['DIRECTEUR', 'COLLECTEUR']} />,
    children: [
      { path: '/collectes',         element: <CollectesListPage /> },
      { path: '/collectes/nouveau', element: <CollecteNewPage /> },
      { path: '/collectes/:id',     element: <CollecteDetailPage /> },
    ],
  },

  // Routes protégées — DIRECTEUR seulement
  {
    element: <AuthGuard allowedRoles={['DIRECTEUR']} />,
    children: [
      { path: '/factures',      element: <FacturesListPage /> },
      { path: '/factures/:id',  element: <FactureDetailPage /> },
      { path: '/audit',         element: <AuditPage /> },
    ],
  },

  // 404
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}