import React, { useEffect, useState, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Line, ComposedChart, Bar,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, TrendingDown, Zap, ShoppingCart, Smartphone, Store, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface MonthlyData {
  month: string;
  panier_moyen: number;
  indice_activite: number;
  taux_online: number;
  taux_physique: number;
  events: string[];
  season: string;
  is_peak: boolean;
  is_transition: boolean;
  transition_direction: string | null;
}

interface Transition {
  month: string;
  direction: string;
  events: string[];
}

interface Peak {
  month: string;
  indice: number;
  events: string[];
}

interface ProductOverlay {
  nom_produit: string;
  categorie: string;
  prix_tnd: number;
  monthly_relevance: Array<{ month: string; relevance: number }>;
}

interface BehavioralCurveData {
  monthly_data: MonthlyData[];
  transitions: Transition[];
  peaks: Peak[];
  summary: {
    avg_basket: number;
    total_consumers: number;
    pct_ramadan_active: number;
    pct_ete_active: number;
    pct_soldes_active: number;
    strongest_month: string;
    weakest_month: string;
  };
  product_overlay: ProductOverlay | null;
}

type ViewMode = 'activite' | 'panier' | 'canaux';

const SEASON_COLORS: Record<string, string> = {
  hiver: '#3B82F6',
  printemps: '#10B981',
  ete: '#F59E0B',
  automne: '#EF4444',
};

const SEASON_LABELS: Record<string, string> = {
  hiver: '❄️ Hiver',
  printemps: '🌸 Printemps',
  ete: '☀️ Été',
  automne: '🍂 Automne',
};

const API_BASE = 'http://localhost:8000';

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-xl border border-gray-100 max-w-[260px]">
      <div className="flex items-center justify-between mb-2">
        <span className="font-serif font-bold text-sm">{data.month}</span>
        <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ backgroundColor: SEASON_COLORS[data.season] + '20', color: SEASON_COLORS[data.season] }}>
          {SEASON_LABELS[data.season]}
        </span>
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Indice d'activité</span>
          <span className="font-bold text-gray-900">{data.indice_activite}%</span>
        </div>
        <div className="flex justify-between">
          <span>Panier moyen</span>
          <span className="font-bold text-gray-900">{data.panier_moyen} TND</span>
        </div>
        <div className="flex justify-between">
          <span>Taux online</span>
          <span className="font-bold text-blue-600">{data.taux_online?.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Taux physique</span>
          <span className="font-bold text-amber-600">{data.taux_physique?.toFixed(1)}%</span>
        </div>
        {data.relevance != null && (
          <div className="flex justify-between border-t pt-1 mt-1">
            <span>Pertinence produit</span>
            <span className="font-bold text-emerald-600">{data.relevance}%</span>
          </div>
        )}
      </div>
      {data.events?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          {data.events.map((e: string, i: number) => (
            <span key={i} className="inline-block text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded mr-1 mb-0.5">
              {e}
            </span>
          ))}
        </div>
      )}
      {data.is_transition && (
        <div className="mt-1 text-[10px] font-bold text-purple-600">
          ⚡ Période de transition ({data.transition_direction})
        </div>
      )}
    </div>
  );
}

// Custom dot for peaks and transitions
function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  if (!payload) return null;

  if (payload.is_peak) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="#C4342D" stroke="#fff" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={10} fill="none" stroke="#C4342D" strokeWidth={1} opacity={0.4}>
          <animate attributeName="r" from="10" to="18" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>
    );
  }

  if (payload.is_transition) {
    return (
      <g>
        <rect x={cx - 5} y={cy - 5} width={10} height={10} rx={2}
          fill="#8B5CF6" stroke="#fff" strokeWidth={2}
          transform={`rotate(45 ${cx} ${cy})`} />
      </g>
    );
  }

  return <circle cx={cx} cy={cy} r={3} fill="#1C1C1C" stroke="#fff" strokeWidth={1.5} />;
}


export function BehavioralCurve() {
  const [data, setData] = useState<BehavioralCurveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('activite');
  const [productInput, setProductInput] = useState('');
  const [activeProduct, setActiveProduct] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const fetchData = async (productName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/behavioral-curve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: productName || null, filters: {} }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setData(result);
      setActiveProduct(productName || null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleProductSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (productInput.trim()) {
      fetchData(productInput.trim());
    }
  };

  const exportPDF = async () => {
    if (!chartRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 8, 10, imgWidth, imgHeight);
      pdf.save('courbe_comportement_annuel.pdf');
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-[#C4342D] animate-spin" />
        <span className="ml-3 text-sm text-gray-500">Chargement des données comportementales...</span>
      </div>
    );
  }

  if (error || !data || data.monthly_data.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        Impossible de charger la courbe comportementale. {error}
      </div>
    );
  }

  // Merge product overlay into monthly data
  const chartData = data.monthly_data.map((m, i) => {
    const overlay = data.product_overlay?.monthly_relevance?.[i];
    return {
      ...m,
      monthShort: m.month.substring(0, 3),
      relevance: overlay?.relevance ?? null,
    };
  });

  return (
    <motion.div
      ref={chartRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-3 border-b border-gray-50">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#C4342D]" />
              Courbe Comportementale Annuelle
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Comportements d'achat du consommateur tunisien — {data.summary.total_consumers.toLocaleString()} profils analysés
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportPDF}
              disabled={isExporting}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500"
              title="Exporter PDF"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* View mode toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {([
            { id: 'activite', label: "Indice d'activité", icon: Zap },
            { id: 'panier', label: 'Panier moyen', icon: ShoppingCart },
            { id: 'canaux', label: 'Canaux (Online vs Physique)', icon: Smartphone },
          ] as { id: ViewMode; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setViewMode(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                viewMode === id
                  ? 'bg-[#C4342D] text-white shadow-sm'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Product overlay search */}
        <form onSubmit={handleProductSearch} className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={productInput}
            onChange={(e) => setProductInput(e.target.value)}
            placeholder="Superposer un produit (ex: Boga Cidre, Harissa...)"
            className="flex-1 text-xs bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 focus:outline-none focus:ring-1 focus:ring-[#C4342D]/30 placeholder:text-gray-300"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-gray-800 transition-colors"
          >
            Overlay
          </button>
          {activeProduct && (
            <button
              type="button"
              onClick={() => { setProductInput(''); fetchData(); }}
              className="text-xs text-red-500 hover:text-red-600"
            >
              ✕ Retirer
            </button>
          )}
        </form>
      </div>

      {/* Chart */}
      <div className="px-4 py-4">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
            <defs>
              <linearGradient id="gradActivity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C4342D" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#C4342D" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradOnline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradPhysical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradProduct" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="monthShort"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              domain={viewMode === 'panier' ? ['auto', 'auto'] : [0, 'auto']}
              tickFormatter={(v) => viewMode === 'panier' ? `${v} TND` : `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Transition reference lines */}
            {data.transitions.map((t, i) => (
              <ReferenceLine
                key={`trans-${i}`}
                x={t.month.substring(0, 3)}
                stroke="#8B5CF6"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `⚡ ${t.direction === 'hausse' ? '↑' : '↓'}`,
                  position: 'top',
                  fill: '#8B5CF6',
                  fontSize: 12,
                }}
              />
            ))}

            {viewMode === 'activite' && (
              <>
                <Area
                  type="monotone"
                  dataKey="indice_activite"
                  stroke="#C4342D"
                  strokeWidth={2.5}
                  fill="url(#gradActivity)"
                  dot={<CustomDot />}
                  activeDot={{ r: 6, fill: '#C4342D', stroke: '#fff', strokeWidth: 2 }}
                  name="Indice d'activité"
                />
                {data.product_overlay && (
                  <Area
                    type="monotone"
                    dataKey="relevance"
                    stroke="#10B981"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    fill="url(#gradProduct)"
                    dot={{ r: 3, fill: '#10B981', stroke: '#fff', strokeWidth: 1 }}
                    name={data.product_overlay.nom_produit}
                  />
                )}
              </>
            )}

            {viewMode === 'panier' && (
              <Bar
                dataKey="panier_moyen"
                fill="#C4342D"
                radius={[4, 4, 0, 0]}
                name="Panier moyen (TND)"
                opacity={0.85}
              />
            )}

            {viewMode === 'canaux' && (
              <>
                <Area
                  type="monotone"
                  dataKey="taux_online"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#gradOnline)"
                  dot={{ r: 3, fill: '#3B82F6', stroke: '#fff', strokeWidth: 1 }}
                  name="Online"
                />
                <Area
                  type="monotone"
                  dataKey="taux_physique"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fill="url(#gradPhysical)"
                  dot={{ r: 3, fill: '#F59E0B', stroke: '#fff', strokeWidth: 1 }}
                  name="Physique"
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend + Insights */}
      <div className="px-6 pb-5 border-t border-gray-50">
        {/* Legend */}
        <div className="flex items-center gap-4 pt-3 mb-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <span className="w-3 h-3 rounded-full bg-[#C4342D]"></span> Pic d'activité
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <span className="w-3 h-3 rounded-sm bg-[#8B5CF6] rotate-45 inline-block"></span> Transition
          </div>
          {data.product_overlay && (
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
              {data.product_overlay.nom_produit} ({data.product_overlay.prix_tnd} TND)
            </div>
          )}
          <div className="flex items-center gap-3 ml-auto">
            {Object.entries(SEASON_LABELS).map(([key, label]) => (
              <span key={key} className="text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: SEASON_COLORS[key] + '15', color: SEASON_COLORS[key] }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Key insights cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <InsightCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Mois le + fort"
            value={data.summary.strongest_month}
            color="#10B981"
          />
          <InsightCard
            icon={<TrendingDown className="w-4 h-4" />}
            label="Mois le + faible"
            value={data.summary.weakest_month}
            color="#EF4444"
          />
          <InsightCard
            icon={<ShoppingCart className="w-4 h-4" />}
            label="Panier moyen"
            value={`${data.summary.avg_basket} TND`}
            color="#3B82F6"
          />
          <InsightCard
            icon={<Zap className="w-4 h-4" />}
            label="Transitions"
            value={`${data.transitions.length} périodes`}
            color="#8B5CF6"
          />
        </div>

        {/* Transition details */}
        {data.transitions.length > 0 && (
          <div className="mt-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Périodes de changement détectées
            </h4>
            <div className="flex gap-2 flex-wrap">
              {data.transitions.map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                  {t.direction === 'hausse' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <strong>{t.month}</strong>
                  {t.events.length > 0 && <span className="opacity-60">({t.events[0]})</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}


function InsightCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '15', color }}>
        {icon}
      </div>
      <div>
        <div className="text-[9px] uppercase tracking-wider text-gray-400">{label}</div>
        <div className="text-sm font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}
