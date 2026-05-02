/**
 * AI Service - Connects to Tunisia B2B Insights Backend
 * Processes user questions through the complete ML pipeline
 */

import { fetchInsights } from './api';
import type { InsightResponse, Language } from '../types/api';

/**
 * Chat with the backend AI agent
 * Processes user questions through the complete ML pipeline
 */
export async function chatWithAgent(
  userMessage: string,
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  onUpdate: (text: string, toolCall?: any) => void
) {
  try {
    // Detect language from user message (simple heuristic)
    const outputLanguage = detectLanguage(userMessage);

    console.log('Sending request to backend:', { userMessage, outputLanguage });

    // Call backend API
    const response: InsightResponse = await fetchInsights(
      userMessage,
      outputLanguage,
      {} // Empty filters - let backend parse from question
    );

    console.log('Received response from backend:', response);

    // Transform backend response to frontend format
    const { charts, profiles, text } = transformBackendResponse(response);

    console.log('Transformed response:', { charts, profiles, textLength: text.length });

    // Update UI with results
    onUpdate(text, { charts, profiles });

  } catch (error) {
    console.error("Error in chatWithAgent:", error);
    const errorMessage = error instanceof Error ? error.message : "Une erreur s'est produite";
    onUpdate(`Désolé, une erreur s'est produite lors du traitement de votre demande.\n\n**Détails:** ${errorMessage}`);
  }
}

/**
 * Detect language from user input
 */
function detectLanguage(text: string): Language {
  // Arabic script detection
  if (/[\u0600-\u06FF]/.test(text)) {
    return "darija";
  }
  
  // French keywords
  const frenchKeywords = ["le", "la", "les", "des", "une", "pour", "dans", "sur", "avec", "est", "sont", "peut", "faire"];
  const lowerText = text.toLowerCase();
  const frenchMatches = frenchKeywords.filter(kw => lowerText.includes(` ${kw} `)).length;
  
  // English keywords
  const englishKeywords = ["the", "is", "are", "can", "what", "how", "show", "give", "make"];
  const englishMatches = englishKeywords.filter(kw => lowerText.includes(` ${kw} `)).length;
  
  if (frenchMatches > englishMatches) {
    return "fr";
  } else if (englishMatches > 0) {
    return "en";
  }
  
  // Default to French for Tunisia
  return "fr";
}

/**
 * Transform backend InsightResponse to frontend format
 * Creates natural storytelling without mentioning "storytelling"
 */
function transformBackendResponse(response: InsightResponse): {
  text: string;
  charts: any[];
  profiles: any[];
} {
  const charts: any[] = [];
  const profiles: any[] = [];

  // Start with the main narrative
  let text = response.storytelling.text;

  // Process MULTIPLE visualizations (new multi-viz API)
  const vizList = response.visualizations && response.visualizations.length > 0
    ? response.visualizations
    : response.visualization ? [response.visualization] : [];

  console.log(`=== PROCESSING ${vizList.length} VISUALIZATIONS ===`);

  for (const viz of vizList) {
    if (!viz.vega_lite_spec || !viz.vega_lite_spec.data) continue;

    const chart = convertVegaToChart(viz);
    if (chart) {
      console.log(`Chart [${viz.chart_role || 'primary'}]: type=${chart.type}, data=${chart.data?.length}`);
      charts.push(chart);
    }
  }

  // Add first chart context naturally
  if (charts.length > 0 && response.visualization?.why_this_chart) {
    text += `\n\n${response.visualization.why_this_chart}`;
  }

  // Add segmentation profiles with natural language
  if (response.segmentation?.segments && response.segmentation.segments.length > 0) {
    const segmentCount = response.segmentation.segments.length;
    text += `\n\n## Les profils identifiés\n\nL'analyse révèle ${segmentCount} profils distincts de consommateurs :`;
    
    response.segmentation.segments.forEach((segment, idx) => {
      const ageAttr = segment.attributes.find(a => a.includes("tranche_age") || a.includes("age"));
      const regionAttr = segment.attributes.find(a => a.includes("gouvernorat") || a.includes("région"));
      const incomeAttr = segment.attributes.find(a => a.includes("revenu") || a.includes("income"));
      
      profiles.push({
        name: segment.name,
        age: ageAttr ? ageAttr.split(":")[1]?.trim() || "Variable" : "Variable",
        income: incomeAttr ? incomeAttr.split(":")[1]?.trim() || "Variable" : "Variable",
        location: regionAttr ? regionAttr.split(":")[1]?.trim() || "Tunisie" : "Tunisie",
        description: `Ce segment représente ${(segment.pct * 100).toFixed(1)}% de la population. Caractéristiques principales : ${segment.attributes.slice(0, 5).join(", ")}.`,
        whyThisSegment: segment.why_this_segment || segment.insight || undefined
      });
    });
  }

  // Add predictive insights
  if (response.predictive && response.predictive.channel_recommendations.length > 0) {
    text += `\n\n## Recommandations stratégiques\n\n`;
    
    const topChannel = response.predictive.channel_recommendations[0];
    const conversionProb = (response.predictive.conversion_prob * 100).toFixed(0);
    
    text += `Pour maximiser l'impact, concentrez vos efforts sur **${formatChannelName(topChannel.channel)}** avec une probabilité de conversion de **${conversionProb}%**.\n\n`;
    
    // Only add channel chart if not already in multi-viz
    const hasChannelChart = charts.some(c => c.title?.includes('canal') || c.title?.includes('channel') || c.title?.includes('Canal'));
    if (!hasChannelChart) {
      const channelChart = {
        type: 'bar',
        title: 'Performance des canaux marketing',
        data: response.predictive.channel_recommendations.map(ch => ({
          name: formatChannelName(ch.channel),
          value: Math.round(ch.score * 100)
        })),
        xAxisLabel: 'Canal',
        yAxisLabel: 'Score de pertinence (%)'
      };
      charts.push(channelChart);
    }
    
    text += `**Hiérarchie des canaux :**\n`;
    response.predictive.channel_recommendations.forEach((ch, idx) => {
      const emoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '•';
      text += `${emoji} ${formatChannelName(ch.channel)} — ${(ch.score * 100).toFixed(0)}% de pertinence\n`;
    });
  }

  // Add product recommendations if available
  if (response.product_recommendations && response.product_recommendations.length > 0) {
    text += `\n\n## Produits à promouvoir\n\n`;
    text += `Voici les produits les plus adaptés à votre audience :\n\n`;
    
    response.product_recommendations.slice(0, 3).forEach((product, idx) => {
      text += `**${idx + 1}. ${product.nom_produit}**\n`;
      text += `   • Catégorie : ${product.categorie}\n`;
      text += `   • Prix : ${product.prix_tnd} TND (${product.prix_segment})\n`;
      if (product.strategie_marketing) {
        text += `   • Approche : ${product.strategie_marketing}\n`;
      }
      text += `\n`;
    });
  }

  return { text, charts, profiles };
}

/**
 * Format channel names for better readability
 */
function formatChannelName(channel: string): string {
  const channelNames: Record<string, string> = {
    'online': 'E-commerce',
    'social_media': 'Réseaux sociaux',
    'whatsapp': 'WhatsApp',
    'physical': 'Magasins physiques',
    'mobile_app': 'Application mobile',
    'email': 'Email marketing',
    'sms': 'SMS',
    'phone': 'Téléphone'
  };
  return channelNames[channel] || channel;
}

/**
 * Convert Vega-Lite spec to our chart format with intelligent type selection
 */
function convertVegaToChart(visualization: InsightResponse['visualization']): any | null {
  if (!visualization.vega_lite_spec || !visualization.vega_lite_spec.data) {
    console.warn('No vega_lite_spec or data found in visualization');
    return null;
  }

  const spec = visualization.vega_lite_spec;
  const rawData = spec.data.values || [];
  
  if (rawData.length === 0) {
    console.warn('Empty data array in vega_lite_spec');
    return null;
  }

  console.log('=== RAW DATA FROM BACKEND ===');
  console.log('Length:', rawData.length);
  console.log('First 3 items:', rawData.slice(0, 3));

  // Normalize data to ensure it has 'name' and 'value' fields
  const data = normalizeChartData(rawData);
  
  console.log('=== NORMALIZED DATA ===');
  console.log('Length:', data.length);
  console.log('First 3 items:', data.slice(0, 3));
  console.log('Fields in first item:', data.length > 0 ? Object.keys(data[0]) : 'NO DATA');

  // Use the chart type from backend (already optimized)
  let chartType = visualization.chart_type;
  const firstDataPoint = data[0];
  const keys = Object.keys(firstDataPoint);
  const numericFields = keys.filter(k => k !== 'name' && typeof firstDataPoint[k] === 'number');
  
  // Handle stacked bar charts (multi-series data)
  if (numericFields.length > 1) {
    return {
      type: "stacked-bar",
      title: spec.title || generateSmartTitle(visualization, data),
      data: data,
      series: numericFields,
      xAxisLabel: spec.encoding?.x?.title || "",
      yAxisLabel: spec.encoding?.y?.title || ""
    };
  }
  
  // Radar charts: convert to bar if too few dimensions
  if (chartType === "radar" && data.length < 4) {
    chartType = "bar";
  }
  
  // Pie charts: convert to bar if too many slices
  if (chartType === "pie" && data.length > 8) {
    chartType = "bar";
  }
  
  // Line charts for many data points
  if (chartType === "bar" && data.length > 15) {
    chartType = "line";
  }

  // Extract axis labels from Vega spec
  const xAxisLabel = spec.encoding?.x?.title || "";
  const yAxisLabel = spec.encoding?.y?.title || "";

  const chartObject = {
    type: chartType,
    title: spec.title || generateSmartTitle(visualization, data),
    data: data,
    xAxisLabel,
    yAxisLabel
  };

  console.log('=== CHART OBJECT CREATED ===');
  console.log('Type:', chartObject.type);
  console.log('Title:', chartObject.title);
  console.log('Data length:', chartObject.data.length);
  console.log('Data sample:', chartObject.data.slice(0, 2));

  return chartObject;
}

/**
 * Normalize chart data to ensure consistent field names and CLEAN labels.
 * - Splits pipe-separated values (fallback if backend sends them)
 * - Truncates long labels
 * - Caps at 10 items for readability
 * - Ensures numeric values are valid numbers
 */
function normalizeChartData(rawData: any[]): any[] {
  if (!rawData || rawData.length === 0) return [];

  const firstItem = rawData[0];
  const keys = Object.keys(firstItem);
  
  // Find the dimension field (usually the first non-numeric field)
  const dimensionField = keys.find(k => typeof firstItem[k] === 'string') || keys[0];
  
  // Find the metric field (usually the first numeric field)
  const metricField = keys.find(k => typeof firstItem[k] === 'number') || keys[1];
  
  // Normalize each row
  const normalized = rawData.map(item => {
    let name = String(item[dimensionField] || item.name || 'Inconnu').trim();
    
    // If name contains pipes (pipe-separated multi-values), skip — bad data
    // We'll filter these out below
    const hasPipe = name.includes('|');
    
    // Truncate long labels for chart readability
    if (name.length > 20) {
      name = name.substring(0, 18) + '…';
    }
    
    const rawValue = item[metricField] ?? item.value ?? 0;
    const value = typeof rawValue === 'number' && !isNaN(rawValue) ? rawValue : Number(rawValue) || 0;
    
    const entry: any = { name, value, _hasPipe: hasPipe };
    
    // Preserve other numeric fields for multi-series charts
    keys.forEach(key => {
      if (key !== dimensionField && key !== metricField && typeof item[key] === 'number') {
        entry[key] = item[key];
      }
    });
    
    return entry;
  });

  // Filter out pipe-separated items (they make unreadable charts)
  const clean = normalized.filter(item => !item._hasPipe && item.value > 0);
  
  // Remove internal flag
  clean.forEach(item => delete item._hasPipe);
  
  // Cap at 10 items for chart readability
  return clean.slice(0, 10);
}

/**
 * Generate contextual chart titles
 */
function generateSmartTitle(visualization: InsightResponse['visualization'], data: any[]): string {
  const spec = visualization.vega_lite_spec;
  
  // Use existing title if good
  if (spec.title && !spec.title.includes("Chart") && !spec.title.includes("Visualization")) {
    return spec.title;
  }
  
  // Generate based on data characteristics
  const dataCount = data.length;
  const firstKey = Object.keys(data[0])[0];
  
  if (firstKey === 'name' || firstKey === 'category') {
    return `Analyse comparative (${dataCount} éléments)`;
  }
  
  return visualization.why_this_chart || "Analyse des données";
}

/**
 * Detect if data is sequential (temporal or ordered)
 */
function isSequentialData(data: any[]): boolean {
  if (data.length < 3) return false;
  
  const firstItem = data[0];
  const nameField = firstItem.name || firstItem.category || '';
  
  // Check for date patterns
  if (/\d{4}|\d{2}\/\d{2}|janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre/i.test(nameField)) {
    return true;
  }
  
  // Check for sequential numbers
  const names = data.map(d => d.name || d.category || '');
  const hasSequentialNumbers = names.every((name, idx) => {
    if (idx === 0) return true;
    const prevNum = parseInt(names[idx - 1]);
    const currNum = parseInt(name);
    return !isNaN(prevNum) && !isNaN(currNum) && currNum > prevNum;
  });
  
  return hasSequentialNumbers;
}
