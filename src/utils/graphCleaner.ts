import { KnowledgeGraph } from '../types';

/**
 * GraphCleaner - Component for cleaning extracted knowledge graphs
 * Removes noise and irrelevant entities to focus on valuable business data
 */

// Define exclusion lists for filtering out noise
const excludedNodeTypes = [
  'Cookie',
  'Cookie Category', 
  'Service',
  'Consent Management Platform',
  'Action',
  'Feature',
  'Document',
  'Language',
  'Navigation',
  'Menu',
  'Button',
  'Link',
  'Form',
  'Input',
  'Page Element',
  'Web Component',
  'UI Element'
];

const excludedNodeLabels = [
  // Technology companies (not medical/dental industry)
  'Amazon',
  'Google', 
  'Meta Platforms, Inc.',
  'Meta Platforms',
  'Meta',
  'Facebook',
  'Microsoft',
  'Apple',
  'Adobe',
  
  // Technical services and platforms
  'Edrone',
  'Cookiebot',
  'Google Analytics',
  'Google Tag Manager',
  'PrestaShop',
  'WordPress',
  'Magento',
  'Shopify',
  'WooCommerce',
  'PayPal',
  'Stripe',
  'Vuex',
  'React',
  'Angular',
  'jQuery',
  
  // Website actions and navigation
  'Zarejestruj się',
  'Zaloguj się',
  'Zaloguj',
  'Logowanie',
  'Rejestracja',
  'Koszyk',
  'Dodaj do koszyka',
  'Kup teraz',
  'Zamów',
  'Kontakt',
  'O nas',
  'Regulamin',
  'Polityka prywatności',
  'Polityka prywatności i cookies',
  'Cookies',
  'RODO',
  'GDPR',
  'Warunki użytkowania',
  'Mapa strony',
  'Sitemap',
  'Newsletter',
  'Subskrypcja',
  'FAQ',
  'Pomoc',
  'Wsparcie',
  'Support',
  'Blog',
  'Aktualności',
  'News',
  'Promocje',
  'Rabaty',
  'Oferta specjalna',
  
  // Generic language/location entities
  'polski',
  'Polska',
  'English',
  'Poland',
  'język polski',
  'polszczyzna',
  
  // Common cookie names and technical identifiers
  '_ga',
  '_gid',
  '_gat',
  '_fbp',
  'PHPSESSID',
  'JSESSIONID',
  'session_id',
  'csrf_token',
  'xsrf_token',
  '_csrf',
  'cookieconsent_status',
  'cookie_consent',
  
  // Generic UI elements
  'Menu',
  'Navigation',
  'Footer',
  'Header',
  'Sidebar',
  'Search',
  'Szukaj',
  'Filter',
  'Filtr',
  'Sort',
  'Sortuj',
  'Login',
  'Register',
  'Cart',
  'Checkout'
];

/**
 * Cleans a knowledge graph by removing noise entities and orphaned edges
 */
export function cleanKnowledgeGraph(rawGraph: KnowledgeGraph): KnowledgeGraph {
  if (!rawGraph || !rawGraph.nodes) {
    return { nodes: [], edges: [] };
  }

  // Step 1: Filter nodes to remove noise
  const allowedNodes = rawGraph.nodes.filter(node => {
    // Check if node type is excluded
    if (excludedNodeTypes.includes(node.type)) {
      return false;
    }
    
    // Check if node label is excluded (case-insensitive)
    const nodeLabel = node.label.toLowerCase().trim();
    const isLabelExcluded = excludedNodeLabels.some(excludedLabel => 
      nodeLabel === excludedLabel.toLowerCase() || 
      nodeLabel.includes(excludedLabel.toLowerCase())
    );
    
    if (isLabelExcluded) {
      return false;
    }
    
    // Additional checks for very short or suspicious labels
    if (nodeLabel.length <= 1) {
      return false;
    }
    
    // Check for technical patterns
    if (nodeLabel.includes('_') && nodeLabel.length < 10) {
      // Likely a technical identifier
      return false;
    }
    
    return true;
  });

  // Step 2: Create set of allowed node IDs for edge filtering
  const allowedNodeIds = new Set(allowedNodes.map(node => node.id));

  // Step 3: Filter edges to keep only those connecting allowed nodes
  const allowedEdges = rawGraph.edges ? rawGraph.edges.filter(edge => 
    allowedNodeIds.has(edge.source) && allowedNodeIds.has(edge.target)
  ) : [];

  return {
    nodes: allowedNodes,
    edges: allowedEdges
  };
}

/**
 * Get statistics about what was filtered out
 */
export function getCleaningStats(originalGraph: KnowledgeGraph, cleanedGraph: KnowledgeGraph) {
  const originalNodes = originalGraph.nodes?.length || 0;
  const originalEdges = originalGraph.edges?.length || 0;
  const cleanedNodes = cleanedGraph.nodes?.length || 0;
  const cleanedEdges = cleanedGraph.edges?.length || 0;
  
  return {
    nodesRemoved: originalNodes - cleanedNodes,
    edgesRemoved: originalEdges - cleanedEdges,
    nodesKept: cleanedNodes,
    edgesKept: cleanedEdges,
    nodesFilteredPercent: originalNodes > 0 ? Math.round(((originalNodes - cleanedNodes) / originalNodes) * 100) : 0,
    edgesFilteredPercent: originalEdges > 0 ? Math.round(((originalEdges - cleanedEdges) / originalEdges) * 100) : 0
  };
}