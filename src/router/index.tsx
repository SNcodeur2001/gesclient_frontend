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
  // Login (public)
  { path: '/login', element: <LoginPage /> },

  // Routes protégées — tous les rôles
  {
    element: <AuthGuard />,
    children: [
      { path: '/',              element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard',     element: <DashboardPage /> },
      { path: '/notifications', element: <NotificationsPage /> },
      { path: '/profil',        element: <ProfilPage /> },
    ],
  },

  // Routes clients — DIRECTEUR + COMMERCIAL + COLLECTEUR
  // (le backend filtre automatiquement par rôle : COLLECTEUR → apporteurs, COMMERCIAL → acheteurs)
  {
    element: <AuthGuard allowedRoles={['DIRECTEUR', 'COMMERCIAL', 'COLLECTEUR']} />,
    children: [
      { path: '/clients',          element: <ClientsListPage /> },
      { path: '/clients/:id',      element: <ClientDetailPage /> },
      { path: '/clients/:id/edit', element: <ClientFormPage /> },
    ],
  },

  // Création + import clients — DIRECTEUR + COMMERCIAL seulement
  {
    element: <AuthGuard allowedRoles={['DIRECTEUR', 'COMMERCIAL']} />,
    children: [
      { path: '/clients/nouveau', element: <ClientFormPage /> },
      { path: '/clients/import',  element: <ClientImportPage /> },
    ],
  },

  // Routes commandes — DIRECTEUR + COMMERCIAL
  {
    element: <AuthGuard allowedRoles={['DIRECTEUR', 'COMMERCIAL']} />,
    children: [
      { path: '/commandes',         element: <CommandesListPage /> },
      { path: '/commandes/nouveau', element: <CommandeNewPage /> },
      { path: '/commandes/:id',     element: <CommandeDetailPage /> },
    ],
  },

  // Routes collectes — DIRECTEUR + COLLECTEUR
  {
    element: <AuthGuard allowedRoles={['DIRECTEUR', 'COLLECTEUR']} />,
    children: [
      { path: '/collectes',         element: <CollectesListPage /> },
      { path: '/collectes/nouveau', element: <CollecteNewPage /> },
      { path: '/collectes/:id',     element: <CollecteDetailPage /> },
    ],
  },

  // Routes DIRECTEUR seulement
  {
    element: <AuthGuard allowedRoles={['DIRECTEUR']} />,
    children: [
      { path: '/factures',     element: <FacturesListPage /> },
      { path: '/factures/:id', element: <FactureDetailPage /> },
      { path: '/audit',        element: <AuditPage /> },
    ],
  },

  // 404 → login
  { path: '*', element: <Navigate to="/login" replace /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}