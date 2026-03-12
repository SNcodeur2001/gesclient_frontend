import { useDashboard } from "./hooks/useDashboard";
import { DashboardCommercialPage } from "./DashboardCommercialPage";
import { DashboardCollecteurPage } from "./DashboardCollecteurPage";
import { PageLayout } from "../../components/layout/PageLayout";
import { useAuthStore } from "../../store/authStore";
import api from "../../lib/axios";
import { useQuery } from "@tanstack/react-query";
import type { NotificationResponseDto } from "../../types";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Users,
  ShoppingCart,
  Recycle,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Leaf,
  ShoppingBag,
} from "lucide-react";

// ─── Hook activité récente (audit) ────────────────────────────────────────────

function useRecentActivity() {
  return useQuery({
    queryKey: ["notifications", "recent"],
    queryFn: async () => {
      const { data } = await api.get("/notifications", {
        params: { page: 1, limit: 5 },
      });
      const list = (data?.data?.items ??
        data?.data ??
        []) as NotificationResponseDto[];
      return [...list].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    },
    staleTime: 1000 * 60 * 2,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function formatKg(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " kg";
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

function VariationBadge({ value }: { value: string }) {
  const isDown = value.startsWith("-");
  return (
    <p
      className={`text-xs font-bold mt-2 flex items-center gap-1 ${isDown ? "text-red-500" : "text-green-600"}`}
    >
      {isDown ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
      {value}
    </p>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-2/3 mb-3" />
      <div className="h-7 bg-slate-100 rounded w-1/2 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-1/4" />
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  variation: string;
  icon: React.ReactNode;
}

function KpiCard({ label, value, variation, icon }: KpiCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold mt-1 text-slate-800 leading-tight">
          {value}
        </p>
        <VariationBadge value={variation} />
      </div>
      <div className="text-blue-200 mt-1">{icon}</div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltipCA({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow text-xs">
      <p className="text-slate-500 mb-1">{label}</p>
      <p className="font-bold text-slate-800">{formatFCFA(payload[0].value)}</p>
    </div>
  );
}

function ChartTooltipCollecte({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow text-xs">
      <p className="text-slate-500 mb-1">{label}</p>
      <p className="font-bold text-slate-800">{formatKg(payload[0].value)}</p>
    </div>
  );
}

// ─── Helpers mois ─────────────────────────────────────────────────────────────

const MONTHS_FR: Record<string, string> = {
  "01": "Jan",
  "02": "Fév",
  "03": "Mar",
  "04": "Avr",
  "05": "Mai",
  "06": "Juin",
  "07": "Juil",
  "08": "Août",
  "09": "Sep",
  "10": "Oct",
  "11": "Nov",
  "12": "Déc",
};

function formatMois(mois: string) {
  const [, m] = mois.split("-");
  return MONTHS_FR[m] ?? mois;
}

// ─── Page principale ──────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuthStore();

  // Routing par rôle
  if (user?.role === "COMMERCIAL") return <DashboardCommercialPage />;
  if (user?.role === "COLLECTEUR") return <DashboardCollecteurPage />;

  // DIRECTEUR par défaut
  return <DashboardDirecteurPage />;
}

// ─── Dashboard Directeur ──────────────────────────────────────────────────────

function DashboardDirecteurPage() {
  const { data, isLoading, isError } = useDashboard();
  const { data: auditLogs, isLoading: auditLoading } = useRecentActivity();

  // Données des graphiques
  const caData = (data?.evolutionCA ?? []).map((d) => ({
    mois: formatMois(d.mois),
    montant: d.montant,
  }));

  const collecteData = (data?.evolutionCollecte ?? []).map((d) => ({
    mois: formatMois(d.mois),
    tonnage: d.tonnage,
  }));

  // KPI cards config
  const kpiCards = data
    ? [
        {
          label: "Total Clients",
          value: formatNumber(
            data.clients.totalApporteurs + data.clients.totalAcheteurs,
          ),
          variation: `+${data.clients.nouveauxCeMois} ce mois`,
          icon: <Users size={28} />,
        },
        {
          label: "Commandes ce mois",
          value: formatNumber(data.commercial.commandesEnCours),
          variation: data.commercial.variationMois,
          icon: <ShoppingCart size={28} />,
        },
        {
          label: "Collectes ce mois",
          value: formatKg(data.collecte.tonnageMois),
          variation: data.collecte.variationMois,
          icon: <Recycle size={28} />,
        },
        {
          label: "Chiffre d'affaires",
          value: formatFCFA(data.commercial.chiffreAffairesMois),
          variation: data.commercial.variationMois,
          icon: <CreditCard size={28} />,
        },
      ]
    : [];

  return (
    <PageLayout title="Tableau de bord">
      <div className="space-y-6">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : isError ? (
            <p className="col-span-4 text-sm text-red-500">
              Impossible de charger les statistiques.
            </p>
          ) : (
            kpiCards.map((card) => <KpiCard key={card.label} {...card} />)
          )}
        </div>

        {/* ── Graphiques ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution CA */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-bold text-slate-800">Évolution du CA</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {caData[0]?.mois ?? "—"} –{" "}
                  {caData[caData.length - 1]?.mois ?? "—"} 2026
                </p>
              </div>
            </div>
            {isLoading ? (
              <div className="h-48 bg-slate-50 rounded-lg animate-pulse" />
            ) : caData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                Pas de données
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={192}>
                <AreaChart
                  data={caData}
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#2563EB"
                        stopOpacity={0.15}
                      />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="mois"
                    tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltipCA />} />
                  <Area
                    type="monotone"
                    dataKey="montant"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    fill="url(#gradCA)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#2563EB" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Collectes barres */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-bold text-slate-800">
                  Collectes de plastique (kg)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {collecteData[0]?.mois ?? "—"} –{" "}
                  {collecteData[collecteData.length - 1]?.mois ?? "—"} 2026
                </p>
              </div>
            </div>
            {isLoading ? (
              <div className="h-48 bg-slate-50 rounded-lg animate-pulse" />
            ) : collecteData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                Pas de données
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={192}>
                <BarChart
                  data={collecteData}
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="mois"
                    tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltipCollecte />} />
                  <Bar
                    dataKey="tonnage"
                    fill="#2563EB"
                    opacity={0.25}
                    radius={[4, 4, 0, 0]}
                    onMouseEnter={(_, _index, e: any) => {
                      if (e?.target) e.target.style.opacity = "1";
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Activité récente ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Activité récente</h3>
            <a
              href="/notifications"
              className="text-[#2563EB] text-sm font-semibold hover:underline"
            >
              Voir tout
            </a>
          </div>
          <div className="overflow-x-auto">
            {auditLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-slate-50 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <RecentActivityTable logs={auditLogs ?? []} />
            )}
          </div>
        </div>

        {/* ── Top Tables ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-4">
          {/* Top Apporteurs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Leaf size={16} className="text-teal-500" />
                Top Apporteurs
              </h3>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Tonnage (kg)
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Total versé (FCFA)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={3} className="px-6 py-3">
                          <div className="h-4 bg-slate-50 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  : (data?.topApporteurs ?? []).map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-3 text-sm font-medium text-slate-800">
                          {a.nom}
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600">
                          {formatNumber(a.tonnage)}
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-slate-800">
                          {formatNumber(a.montant)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Top Acheteurs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ShoppingBag size={16} className="text-blue-500" />
                Top Acheteurs
              </h3>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    CA total (FCFA)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={2} className="px-6 py-3">
                          <div className="h-4 bg-slate-50 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  : (data?.topAcheteurs ?? []).map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-3 text-sm font-medium text-slate-800">
                          {a.nom}
                        </td>
                        <td className="px-6 py-3 text-sm font-bold text-slate-800">
                          {formatNumber(a.chiffreAffaires)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// ─── Activité récente — données réelles depuis /notifications ─────────────────

const NOTIF_TYPE_STYLES: Record<string, { label: string; className: string }> =
  {
    NOUVELLE_COLLECTE: {
      label: "Collecte",
      className: "bg-teal-100 text-teal-700",
    },
    ACOMPTE_RECU: {
      label: "Paiement",
      className: "bg-green-100 text-green-700",
    },
    COMMANDE_PRETE: {
      label: "Commande",
      className: "bg-purple-100 text-purple-700",
    },
    COMMANDE_FINALISEE: {
      label: "Commande",
      className: "bg-green-100 text-green-700",
    },
    IMPORT_TERMINE: {
      label: "Import",
      className: "bg-indigo-100 text-indigo-700",
    },
    COMMANDE_EN_ATTENTE: {
      label: "Commande",
      className: "bg-amber-100 text-amber-700",
    },
  };

function formatDateTime(isoDate: string) {
  const d = new Date(isoDate);
  const date = d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
  const time = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} ${time}`;
}

function RecentActivityTable({ logs }: { logs: NotificationResponseDto[] }) {
  if (logs.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-slate-400 text-sm">
        Aucune activité récente
      </div>
    );
  }

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50">
          <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Date/Heure
          </th>
          <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Type
          </th>
          <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Description
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {logs.map((notif) => {
          const style = NOTIF_TYPE_STYLES[notif.type] ?? {
            label: notif.type,
            className: "bg-slate-100 text-slate-500",
          };
          return (
            <tr key={notif.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                {formatDateTime(notif.createdAt)}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 text-[11px] font-bold rounded uppercase ${style.className}`}
                >
                  {style.label}
                </span>
              </td>
              <td className="px-6 py-4 text-sm font-medium text-slate-800">
                {notif.message}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
