import React, { useState, useMemo, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Brush,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis,
  AreaChart, Area,
} from 'recharts';
import { Download, FileSpreadsheet, Loader2, Palette, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Radar as RadarIcon, Circle, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ChartProps {
  type: 'bar' | 'line' | 'pie' | 'stacked-bar' | 'radar' | 'scatter' | 'area';
  title: string;
  data: any[];
  series?: string[];
  xAxisLabel?: string;
  yAxisLabel?: string;
}

type ThemeOption = {
  id: string;
  name: string;
  palette: string[];
  primary: string;
  secondary: string;
  background: string;
  fontFamily: string;
};

const THEMES: ThemeOption[] = [
  {
    id: 'editorial',
    name: 'AAM BEJI',
    palette: ['#1C1C1C', '#C4342D', '#D1C8B4', '#8C8578', '#4A463F', '#E5DFD3'],
    primary: '#1C1C1C',
    secondary: '#C4342D',
    background: '#ffffff',
    fontFamily: 'serif'
  },
  {
    id: 'ocean',
    name: 'Océan',
    palette: ['#0f172a', '#0284c7', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe'],
    primary: '#0284c7',
    secondary: '#0ea5e9',
    background: '#f8fafc',
    fontFamily: 'sans-serif'
  },
  {
    id: 'forest',
    name: 'Forêt',
    palette: ['#14532d', '#16a34a', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'],
    primary: '#16a34a',
    secondary: '#22c55e',
    background: '#f0fdf4',
    fontFamily: 'sans-serif'
  },
  {
    id: 'sunset',
    name: 'Crépuscule',
    palette: ['#7c2d12', '#ea580c', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'],
    primary: '#ea580c',
    secondary: '#f97316',
    background: '#fff7ed',
    fontFamily: 'serif'
  },
  {
    id: 'monochrome',
    name: 'Mono',
    palette: ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'],
    primary: '#334155',
    secondary: '#64748b',
    background: '#f8fafc',
    fontFamily: 'monospace'
  }
];

export function DataChart({ type: initialType, title, data, xAxisLabel, yAxisLabel }: ChartProps) {
  const [chartType, setChartType] = useState(initialType);
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
  const chartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [activeTheme, setActiveTheme] = useState<ThemeOption>(THEMES[0]);

  // Smart chart type suggestion based on data
  const suggestedChartType = useMemo(() => {
    if (!data || data.length === 0) return initialType;
    
    const dataLength = data.length;
    const firstItem = data[0];
    const keys = Object.keys(firstItem);
    const numericFields = keys.filter(k => k !== 'name' && typeof firstItem[k] === 'number');
    
    // Multi-series data → stacked bar or line
    if (numericFields.length > 1) {
      return 'stacked-bar';
    }
    
    // Few items (≤6) → pie chart works well
    if (dataLength <= 6) {
      return 'pie';
    }
    
    // Many items (>15) → line chart for trends
    if (dataLength > 15) {
      return 'line';
    }
    
    // Default to bar for comparisons
    return 'bar';
  }, [data, initialType]);

  const toggleItem = (name: string) => {
    setHiddenItems(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const exportCSV = () => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(',')).join('\n');
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.replace(/\\s+/g, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = async () => {
    if (!chartRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        backgroundColor: activeTheme.background,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${title.replace(/\\s+/g, '_').toLowerCase()}.pdf`);
    } catch (err) {
      console.error('Failed to export PDF', err);
    } finally {
      setIsExporting(false);
    }
  };

  const seriesKeys = useMemo(() => {
    if (data && data.length > 0) {
      const keys = Object.keys(data[0]).filter(k => k !== 'name');
      if (keys.length > 0) return keys;
    }
    return ['value'];
  }, [data]);

  const isMultiSeries = seriesKeys.length > 1;

  const legendItems = useMemo(() => {
    if (isMultiSeries) {
      return seriesKeys;
    }
    return data.map(item => item.name);
  }, [data, seriesKeys, isMultiSeries]);

  const filteredData = useMemo(() => {
    if (isMultiSeries) {
      // In multi-series, we don't drop rows, we hide them in rendering.
      return data;
    }
    return data.filter(item => !hiddenItems.has(item.name));
  }, [data, hiddenItems, isMultiSeries]);

  const totalValue = useMemo(() => {
    return filteredData.reduce((sum, item) => {
      if (isMultiSeries) {
        return sum + seriesKeys.reduce((s, k) => s + (item[k] || 0), 0);
      }
      return sum + (item.value || 0);
    }, 0);
  }, [filteredData, isMultiSeries, seriesKeys]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      if (isMultiSeries || chartType === 'stacked-bar' || seriesKeys.length > 1) {
         const colTotal = payload.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
         return (
             <div className="p-3 shadow-lg border" style={{ backgroundColor: activeTheme.background, borderColor: `${activeTheme.palette[0]}33`, color: activeTheme.palette[0], fontFamily: activeTheme.fontFamily }}>
                 <p className="font-bold text-xs uppercase tracking-wider m-0 mb-2 pb-2 border-b" style={{ borderColor: `${activeTheme.palette[0]}20` }}>{label}</p>
                 <div className="flex flex-col gap-1.5 text-sm">
                   {payload.map((entry: any, index: number) => {
                      // Filter out if this series is hidden
                      if (hiddenItems.has(entry.dataKey)) return null;
                      return (
                      <div key={index} className="flex justify-between items-center gap-6">
                         <div className="flex items-center gap-2">
                           <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.fill }}></span>
                           <span className="opacity-70 text-xs text-left">{entry.name} :</span>
                         </div>
                         <div className="flex items-center gap-3">
                           <span className="font-mono font-medium">{entry.value}</span>
                           <span className="font-mono text-[10px] opacity-60">
                             {colTotal > 0 ? ((entry.value / colTotal) * 100).toFixed(1) : '0.0'}%
                           </span>
                         </div>
                      </div>
                      );
                   })}
                 </div>
             </div>
         );
      }
      // Single series
      const dataPoint = payload[0].payload;
      const value = payload[0].value;
      const name = dataPoint.name || payload[0].name;
      const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0.0';
      const color = payload[0].fill || payload[0].color || activeTheme.primary;

      return (
        <div 
          className="p-3 shadow-lg border"
          style={{ 
            backgroundColor: activeTheme.background, 
            borderColor: `${activeTheme.palette[0]}33`,
            color: activeTheme.palette[0],
            fontFamily: activeTheme.fontFamily
          }}
        >
          <div className="flex items-center gap-2 mb-2 pb-2 border-b" style={{ borderColor: `${activeTheme.palette[0]}20` }}>
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
            <p className="font-bold text-xs uppercase tracking-wider m-0">{name}</p>
          </div>
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between items-center gap-6">
              <span className="opacity-70 text-xs text-left">Valeur :</span>
              <span className="font-mono font-medium">{value}</span>
            </div>
            <div className="flex justify-between items-center gap-6">
              <span className="opacity-70 text-xs text-left">Part (%) :</span>
              <span className="font-mono font-medium">{percentage}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="w-full bg-white border border-gray-200 rounded-lg p-6 my-6 shadow-sm hover:shadow-md transition-shadow" 
      style={{ fontFamily: activeTheme.fontFamily }}
    >
      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1" style={{ color: activeTheme.palette[0] }}>{title}</h3>
          {(xAxisLabel || yAxisLabel) && (
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              {xAxisLabel && yAxisLabel ? `${xAxisLabel} × ${yAxisLabel}` : xAxisLabel || yAxisLabel}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 relative">
          <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
            <button 
              onClick={() => setChartType('bar')} 
              title="Graphique en barres"
              className={`p-2 transition-all rounded ${chartType === 'bar' ? 'bg-[#C4342D] text-white' : 'hover:bg-gray-100 text-gray-400'}`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setChartType('line')} 
              title="Graphique en ligne"
              className={`p-2 transition-all rounded ${chartType === 'line' ? 'bg-[#C4342D] text-white' : 'hover:bg-gray-100 text-gray-400'}`}
            >
              <LineChartIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setChartType('pie')} 
              title="Graphique circulaire"
              className={`p-2 transition-all rounded ${chartType === 'pie' ? 'bg-[#C4342D] text-white' : 'hover:bg-gray-100 text-gray-400'}`}
            >
              <PieChartIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setChartType('radar')} 
              title="Graphique radar"
              className={`p-2 transition-all rounded ${chartType === 'radar' ? 'bg-[#C4342D] text-white' : 'hover:bg-gray-100 text-gray-400'}`}
            >
              <RadarIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setChartType('scatter')} 
              title="Nuage de points"
              className={`p-2 transition-all rounded ${chartType === 'scatter' ? 'bg-[#C4342D] text-white' : 'hover:bg-gray-100 text-gray-400'}`}
            >
              <Circle className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setChartType('area')} 
              title="Graphique en aire"
              className={`p-2 transition-all rounded ${chartType === 'area' ? 'bg-[#C4342D] text-white' : 'hover:bg-gray-100 text-gray-400'}`}
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setShowThemePicker(!showThemePicker)} 
            title="Changer le thème"
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-600"
          >
            <Palette className="w-4 h-4" />
          </button>
          <button 
            onClick={exportCSV} 
            title="Exporter en CSV"
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-600"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
          <button 
            onClick={exportPDF} 
            title="Exporter en PDF"
            disabled={isExporting}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-600 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>

          {showThemePicker && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full right-0 mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[220px]"
            >
              <div className="text-[10px] uppercase tracking-wider font-bold mb-3 text-gray-500">Thèmes disponibles</div>
              <div className="flex flex-col gap-2">
                {THEMES.map(theme => (
                  <button 
                    key={theme.id}
                    onClick={() => { setActiveTheme(theme); setShowThemePicker(false); }}
                    className={`flex items-center justify-between px-3 py-2 text-sm text-left transition-all rounded border ${activeTheme.id === theme.id ? 'bg-[#C4342D] text-white border-[#C4342D] font-semibold' : 'hover:bg-gray-50 border-transparent'}`}
                  >
                    {theme.name}
                    <div className="flex gap-1">
                      {theme.palette.slice(0, 3).map((c, i) => (
                        <span key={i} className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: c }}></span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div ref={chartRef} className="p-4 bg-gradient-to-br from-gray-50/50 to-white rounded-lg" style={{ backgroundColor: activeTheme.background }}>
        {/* Legend with better styling */}
        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-100">
        {legendItems.map((itemName, index) => {
          const isHidden = hiddenItems.has(itemName);
          const itemColor = (chartType === 'pie' || isMultiSeries)
            ? activeTheme.palette[index % activeTheme.palette.length] 
            : activeTheme.primary;
            
          return (
            <button
              key={itemName}
              onClick={() => toggleItem(itemName)}
              style={{
                backgroundColor: isHidden ? 'transparent' : 'white',
                borderColor: isHidden ? 'transparent' : itemColor,
                color: isHidden ? `${activeTheme.palette[0]}66` : activeTheme.palette[0],
              }}
              className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 border-2 rounded-full transition-all cursor-pointer ${
                isHidden ? 'line-through opacity-50' : 'opacity-100 shadow-sm hover:shadow'
              }`}
            >
              <span 
                className="w-3 h-3 rounded-full shrink-0" 
                style={{ 
                  backgroundColor: isHidden ? 'transparent' : itemColor,
                  border: `2px solid ${itemColor}`
                }} 
              />
              {itemName}
            </button>
          );
        })}
      </div>

      <div className="h-80 w-full">{/* Increased height for better visibility */}
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' || chartType === 'stacked-bar' ? (
            <BarChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="rgba(0,0,0,0.1)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(0,0,0,0.4)" fontSize={10} tickLine={false} axisLine={false} dx={0} dy={10} angle={-15} textAnchor="end" />
              <YAxis stroke="rgba(0,0,0,0.4)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
              />
              {isMultiSeries ? (
                 seriesKeys.map((key, idx) => (
                   !hiddenItems.has(key) && (
                      <Bar 
                        key={key} 
                        dataKey={key} 
                        stackId={chartType === 'stacked-bar' ? "a" : undefined}
                        fill={activeTheme.palette[idx % activeTheme.palette.length]} 
                        radius={0} 
                      />
                   )
                 ))
              ) : (
                <Bar dataKey={seriesKeys[0]} fill={activeTheme.primary} radius={0} />
              )}
              <Brush dataKey="name" height={20} stroke="rgba(0,0,0,0.3)" fill={activeTheme.background} travellerWidth={10} tickFormatter={() => ''} />
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="rgba(0,0,0,0.1)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(0,0,0,0.4)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="rgba(0,0,0,0.4)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                content={<CustomTooltip />}
              />
              {isMultiSeries ? (
                 seriesKeys.map((key, idx) => (
                   !hiddenItems.has(key) && (
                      <Line 
                        key={key} 
                        type="monotone" 
                        dataKey={key} 
                        stroke={activeTheme.palette[idx % activeTheme.palette.length]} 
                        strokeWidth={2} 
                        dot={{ fill: activeTheme.palette[idx % activeTheme.palette.length], strokeWidth: 0, r: 4 }} 
                        activeDot={{ r: 6, fill: activeTheme.palette[idx % activeTheme.palette.length] }} 
                      />
                   )
                 ))
              ) : (
                <Line type="monotone" dataKey={seriesKeys[0]} stroke={activeTheme.secondary} strokeWidth={2} dot={{ fill: activeTheme.secondary, strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: activeTheme.primary }} />
              )}
              <Brush dataKey="name" height={20} stroke="rgba(0,0,0,0.3)" fill={activeTheme.background} travellerWidth={10} tickFormatter={() => ''} />
            </LineChart>
          ) : chartType === 'radar' ? (
            <RadarChart cx="50%" cy="50%" outerRadius={90} data={filteredData}>
              <PolarGrid stroke="rgba(0,0,0,0.15)" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: activeTheme.palette[0] }} />
              <PolarRadiusAxis tick={{ fontSize: 9 }} />
              <Tooltip content={<CustomTooltip />} />
              {isMultiSeries ? (
                seriesKeys.map((key, idx) => (
                  !hiddenItems.has(key) && (
                    <Radar
                      key={key}
                      name={key}
                      dataKey={key}
                      stroke={activeTheme.palette[idx % activeTheme.palette.length]}
                      fill={activeTheme.palette[idx % activeTheme.palette.length]}
                      fillOpacity={0.25}
                    />
                  )
                ))
              ) : (
                <Radar name="value" dataKey={seriesKeys[0]} stroke={activeTheme.primary} fill={activeTheme.primary} fillOpacity={0.3} />
              )}
            </RadarChart>
          ) : chartType === 'scatter' ? (
            <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="name" type="category" stroke="rgba(0,0,0,0.4)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis dataKey={seriesKeys[0]} type="number" stroke="rgba(0,0,0,0.4)" fontSize={10} tickLine={false} axisLine={false} />
              <ZAxis range={[60, 400]} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter data={filteredData} fill={activeTheme.primary}>
                {filteredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={activeTheme.palette[index % activeTheme.palette.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          ) : chartType === 'area' ? (
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="rgba(0,0,0,0.1)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(0,0,0,0.4)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="rgba(0,0,0,0.4)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {isMultiSeries ? (
                seriesKeys.map((key, idx) => (
                  !hiddenItems.has(key) && (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stackId="1"
                      stroke={activeTheme.palette[idx % activeTheme.palette.length]}
                      fill={activeTheme.palette[idx % activeTheme.palette.length]}
                      fillOpacity={0.3}
                    />
                  )
                ))
              ) : (
                <Area type="monotone" dataKey={seriesKeys[0]} stroke={activeTheme.primary} fill={activeTheme.primary} fillOpacity={0.3} />
              )}
              <Brush dataKey="name" height={20} stroke="rgba(0,0,0,0.3)" fill={activeTheme.background} travellerWidth={10} tickFormatter={() => ''} />
            </AreaChart>
          ) : (
            <PieChart>
               <Tooltip 
                 content={<CustomTooltip />}
               />
               <Pie 
                 data={filteredData} 
                 dataKey={seriesKeys[0]} 
                 nameKey="name" 
                 cx="50%" 
                 cy="50%" 
                 outerRadius={90} 
                 innerRadius={45}
                 label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                 labelLine={{ stroke: 'rgba(0,0,0,0.2)' }}
                 stroke={activeTheme.background}
                 strokeWidth={2}
                >
                  {filteredData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={activeTheme.palette[index % activeTheme.palette.length]} />
                  ))}
               </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
      </div>
    </motion.div>
  );
}
