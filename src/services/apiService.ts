import { OpenRouterModel, SerpResult, KnowledgeGraph } from '../types';

// Language mapping constant to avoid duplication
const LANGUAGE_MAP: Record<string, string> = {
  'pl': 'Polish',
  'en': 'English',
  'de': 'German',
  'es': 'Spanish',
  'fr': 'French'
};

export class ApiService {
  private apiKeys: { openrouter: string; jina: string; serpdata: string };

  constructor(apiKeys: { openrouter: string; jina: string; serpdata: string }) {
    this.apiKeys = apiKeys;
  }

  private getLanguageName(code: string): string {
    return LANGUAGE_MAP[code] || 'English';
  }

  async fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
    try {
      if (!this.apiKeys.openrouter) {
        throw new Error('OpenRouter API key is required');
      }

      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.openrouter}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Semantic Architect V-Lite',
        },
      });

      if (!response.ok) {
        let errorMessage = `Failed to fetch models: ${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.json();
          if (errorBody.error && errorBody.error.message) {
            errorMessage = `Failed to fetch models: ${errorBody.error.message}`;
          } else if (errorBody.message) {
            errorMessage = `Failed to fetch models: ${errorBody.message}`;
          }
        } catch (parseError) {
          // Fall back to status text if response body is not valid JSON
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      return [];
    }
  }

  async queryOpenRouter(model: string, messages: any[], temperature = 0.7): Promise<string> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKeys.openrouter}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
        }),
      });

      if (!response.ok) {
        let errorMessage = `OpenRouter API error: ${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.json();
          if (errorBody.error && errorBody.error.message) {
            errorMessage = `OpenRouter API error: ${errorBody.error.message}`;
          } else if (errorBody.message) {
            errorMessage = `OpenRouter API error: ${errorBody.message}`;
          }
        } catch (parseError) {
          // Fall back to status text if response body is not valid JSON
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error querying OpenRouter:', error);
      throw error;
    }
  }

  async performQueryExpansion(centralEntity: string, businessContext: string, language: string, count: number, model: string): Promise<string[]> {
    const messages = [
      {
        role: 'system',
        content: `You are an expert SEO and content strategist. Generate diverse, relevant search queries for comprehensive content analysis.`
      },
      {
        role: 'user',
        content: `
ROLE: You are an expert SEO and content strategist, functioning as a topic exploration engine. Your task is to generate a hierarchical structure of search queries.

Central Entity: "${centralEntity}"
Business Context: "${businessContext}"
Target Language: ${language}
Number of Core Concepts to Generate: ${count} // \`count\` teraz kontroluje liczbę głównych gałęzi

TASK:
Generate a hierarchical list of diverse search queries that comprehensively cover the topic. Structure your response as a nested list in Markdown format. The structure should be:
- [Core Concept Query 1 - Broad, foundational query]
  - [Sub-query 1.1 - More specific, drilling down]
  - [Sub-query 1.2 - Exploring a different aspect of Core Concept 1]
- [Core Concept Query 2 - Another broad, foundational query]
  - [Sub-query 2.1 - Specific question related to Core Concept 2]
  - [Sub-query 2.2 - Transactional query related to Core Concept 2]

RULES:
- Generate exactly ${count} top-level "Core Concept Queries".
- For each Core Concept, generate 2-3 specific "Sub-queries".
- All queries must be in the ${language} language.
- Respond with ONLY the Markdown list.
        `
      }
    ];

    const response = await this.queryOpenRouter(model, messages);
    return response;
  }

  async searchSerp(query: string, language: string, location: string, count: number): Promise<SerpResult[]> {
    try {
      const params = new URLSearchParams({
        keyword: query,
        hl: language,
        gl: location,
        num: count.toString(),
      });
      const response = await fetch(`https://api.serpdata.io/v1/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.serpdata}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = `SerpData API error: ${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.json();
          if (errorBody.error && errorBody.error.message) {
            errorMessage = `SerpData API error: ${errorBody.error.message}`;
          } else if (errorBody.message) {
            errorMessage = `SerpData API error: ${errorBody.message}`;
          }
        } catch (parseError) {
          // Fall back to status text if response body is not valid JSON
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Debug: log the response structure
      console.log('SerpData API Response:', JSON.stringify(data, null, 2));

      // SerpData API returns structure: { data: { results: { organic_results: [...], snippets: {...} } } }
      // The outer wrapper is from the API response, so we access data.data.results
      const apiResults = data.data?.results;
      const organicResults = apiResults?.organic_results || [];

      // Extract additional queries from multiple sources
      const additionalQueries: string[] = [];

      // Source 1: People Also Ask questions - from snippets.people_also_ask.questions
      const paaData = apiResults?.snippets?.people_also_ask;
      if (paaData?.questions) {
        const paaQuestions = paaData.questions.map((q: any) => q.text || q.question || '').filter(Boolean);
        additionalQueries.push(...paaQuestions);
      }

      // Source 2: Related Searches - from snippets.related_searches.queries
      const relatedSearches = apiResults?.snippets?.related_searches?.queries || [];
      additionalQueries.push(...relatedSearches);

      console.log('Extracted organic results:', organicResults);
      console.log('Extracted additional queries from PAA and Related Searches:', additionalQueries);

      // Map results with proper validation
      // SerpData organic_results use: pos (not position), url (not link), title, domain
      const mappedResults = organicResults.slice(0, count).map((result: any) => ({
        position: result.pos || result.position || 0,
        title: result.title || '',
        link: result.url || result.link || '', // SerpData uses 'url' field
        snippet: result.snippet || result.description || '',
        additionalQueries: additionalQueries // Attach all additional queries to each result
      })).filter((result: SerpResult) => result.link && result.link.trim() !== ''); // Filter out empty URLs

      console.log('Final mapped results:', mappedResults);

      return mappedResults;
    } catch (error) {
      console.error('Error searching SERP:', error);
      throw error;
    }
  }

  async scrapeContent(url: string): Promise<string> {
    try {
      const response = await fetch('https://r.jina.ai/' + encodeURIComponent(url), {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.jina}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Jina API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.content || '';
    } catch (error) {
      console.error('Error scraping content:', error);
      throw error;
    }
  }

  async extractKnowledgeGraph(
    content: string, 
    centralEntity: string, 
    businessContext: string, 
    url: string, 
    model: string, 
    language: string
  ): Promise<KnowledgeGraph> {
    const targetLanguage = this.getLanguageName(language);
    
    const messages = [
      {
        role: 'system',
        content: `ROLE: You are a precision knowledge graph extraction system. Your task is to analyze content and output ONLY a valid JSON object representing the semantic knowledge within, adhering strictly to the specified TARGET LANGUAGE.

TARGET LANGUAGE: ${targetLanguage}

CRITICAL LANGUAGE INSTRUCTION:
All extracted 'label' and 'type' values in the final JSON MUST be in the TARGET LANGUAGE. If you encounter an entity or concept in another language (e.g., an English term on a Polish site), you MUST translate it accurately to the TARGET LANGUAGE. For example, if the content mentions "root canal treatment" but the TARGET LANGUAGE is Polish, the node label MUST be "Leczenie kanałowe". Maintain semantic accuracy while ensuring linguistic consistency.`
      },
      {
        role: 'user',
        content: `BUSINESS CONTEXT: ${businessContext}

RULES AND EXCLUSIONS (CRITICAL!):
- IGNORE AND DO NOT CREATE ENTITIES FOR: anything related to website cookies, cookie categories, privacy policies, user actions (login, register, cart), website features, navigation elements, or general IT service providers (Google, Amazon, Meta, etc.) unless they are directly relevant to the BUSINESS CONTEXT.

FOCUS AND PRIORITIZATION (CRITICAL!):
- Your primary focus is to extract entities that are directly relevant to the provided BUSINESS CONTEXT and the Central Entity: "${centralEntity}".
- The BUSINESS CONTEXT is your main guide for determining what is important. Based on it, you must dynamically identify and extract:
  - Key products, services, and concepts related to the central topic.
  - Brands, manufacturers, companies, and organizations active in this specific field.
  - Important features, properties, and attributes of the products/services.
  - Relevant categories, subcategories, and procedures.
  - Any other type of entity that is critical for understanding this specific industry or topic.
- MERGE DUPLICATES: If an entity appears with different types, create a single, consistent node for it.

TASK:
Extract a knowledge graph from the content below, which is about "${centralEntity}".

Content: ${content}

Return ONLY a JSON object with this exact structure:

        {
          "nodes": [
            {
              "id": "unique_id_with_type",
              "label": "Entity Name",
              "type": "Entity Type",
              "properties": {"key": "value"}
            }
          ],
          "edges": [
            {
              "source": "source_node_id",
              "target": "target_node_id",
              "relationship": "RELATIONSHIP_TYPE",
              "weight": 0.0
            }
          ]
        }

**Instructions for 'weight' property:**
The 'weight' must be a floating-point number between 0.1 and 1.0, representing your confidence in the extracted relationship based on the source text.
- **Use 0.9 - 1.0** for direct, unambiguous statements of fact (e.g., "X is a type of Y", "X is manufactured by Y").
- **Use 0.6 - 0.8** for strong, implied relationships (e.g., a section about X is a major part of an article about Y).
- **Use 0.1 - 0.5** for weak, contextual, or indirect associations.
Do not assign a weight of 0.0 unless the relationship is purely speculative.`
      }
    ];

    try {
      const response = await this.queryOpenRouter(model, messages, 0.3);
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonStr = response.slice(jsonStart, jsonEnd);
        return JSON.parse(jsonStr);
      }
      
      throw new Error('Invalid JSON response from AI model');
    } catch (error) {
      console.error('Error extracting knowledge graph:', error);
      return { nodes: [], edges: [] };
    }
  }

  async generateTopicalMap(
    consolidatedGraph: KnowledgeGraph,
    centralEntity: string,
    businessContext: string,
    language: string,
    model: string
  ): Promise<string> {
    const targetLanguage = this.getLanguageName(language);
    
    const messages = [
      {
        role: 'system',
        content: `You are an expert content strategist and SEO specialist. Create comprehensive topical maps based on knowledge graphs, writing exclusively in the specified TARGET LANGUAGE.

TARGET LANGUAGE: ${targetLanguage}

LANGUAGE CONSISTENCY INSTRUCTION:
Ensure that the entire report, including all headers, subtopics, analysis, and strategic recommendations, is written exclusively in the TARGET LANGUAGE. Use proper terminology and phrasing native to this language. Do not mix languages in the output.`
      },
      {
        role: 'user',
        content: `Your task is to act as a world-class SEO Architect and Data Strategist. You will systematically unpack and transform the provided knowledge graph into a massive, deeply detailed, and actionable topical map. The final output must be an exhaustive strategic plan written exclusively in the TARGET LANGUAGE.

          Business Context: "${businessContext}"
          Target Language: ${targetLanguage}
          
          Knowledge Graph:
          ${JSON.stringify(consolidatedGraph, null, 2)}
          
          ---
          
          **OUTPUT STRUCTURE AND INSTRUCTIONS:**

          Create a well-structured topical map in Markdown format. Be exhaustive in each section. Your goal is to generate a plan so detailed that an SEO team can work off it for the next 6-12 months.

          **1. Executive Summary & Strategic Overview**
          - Briefly summarize the topic landscape based on the graph's density and key clusters.
          - Identify the primary user intents discovered (transactional, informational).
          - State the core strategic imperative for the client based on their Business Context and the data.

          **2. Proposed Information Architecture & URL Structure**
          - Based on the graph's hierarchy, propose a logical site structure.
          - Start with main categories (e.g., /products/, /knowledge-base/, /pricing/).
          - Propose sub-category structures and example final URLs based on the graph's nodes.
          - **Example (language-neutral structure):**
            - /product-category/[main-product-type]/
            - /product-category/[main-product-type]/[sub-product-type]/
            - /knowledge-base/interactive-calculators/
            - /comparison/[competitor-a]-vs-[competitor-b]/

          **3. Deep Dive: Core Topic Clusters (Pillar & Spoke Model)**
          - Identify 3-5 of the most important, densely connected clusters from the graph.
          - For EACH cluster:
            - **a) Propose a "Pillar Page":** Suggest a comprehensive title and a brief description of its goal.
            - **b) Detail "Spoke Content":** Systematically list specific nodes from the knowledge graph that should become individual articles or sub-sections supporting the pillar page. For each spoke, provide a suggested title and a one-sentence description of its purpose.
            - **Example (language-neutral pattern):**
              - **Pillar Page:** "[Central Topic]: The Complete Guide to [Central Topic]"
              - **Spoke Content:**
                - *Node: [Specific Product Type, e.g., "Ketogenic Diet"]*: Proposed Article: "How Our [Specific Product Type] Works: Features & Results". Description: A product-focused landing page detailing this specific offering.
                - *Node: [Core Concept, e.g., "Ketogenic Diet Principles"]*: Proposed Article: "7 Key Principles of [Core Concept] for Beginners". Description: An educational article explaining the fundamentals.
                - *... (continue for all relevant nodes)* ...

          **4. Semantic Linking Blueprint (Internal Linking Strategy)**
          - Analyze the "edges" array in the knowledge graph.
          - Create a Markdown table that translates the most important relationships into an actionable internal linking plan.
          - **The table must have these English column headers:** | Page A (Source) | Relation (Context) | Page B (Target) | Suggested Anchor Text |
          - The content of the table must be in the TARGET LANGUAGE.
          - **Example (language-neutral pattern):**
            | Article about "[Specific Topic]" | "is a type of" | Category Page "[Broader Topic]" | "discover all our [Broader Topic] solutions" |

          **5. Granular Content Opportunities & Angle Analysis**
          - Go beyond generic ideas. Propose at least 10 specific, compelling content titles based on less obvious nodes or combinations of nodes in the graph.
          - For each idea, specify the recommended content format (e.g., "Listicle", "How-To Guide", "Comparison Article", "Case Study", "Interactive Tool").
          - **Example (language-neutral pattern):**
            - **Title:** "[Competitor Brand A] vs. [Competitor Brand B]: Which [Product] is Better for [User Segment]? (A Detailed Comparison)"
            - **Format:** Comparison Article

          **6. Competitor & Product Entity Analysis**
          - Extract all nodes from the graph where the "type" is "Company", "Organization", or "Brand" and list them as identified competitors.
          - Extract key nodes where the "type" is "Product" or a specific product type. For a few key ones, suggest how the client's products can be positioned against them based on their properties in the graph.

          **7. Advanced Content Gap Analysis**
          - **a) Conceptual Gaps:** Based on your expert knowledge and the provided Business Context, what topics are missing from the entire landscape defined by the graph?
          - **b) Structural Gaps:** Identify "weakly-connected nodes" within the graph itself – entities that were mentioned but have very few relationships. These represent underdeveloped topics by the competition and are prime opportunities. List at least 5 such nodes and suggest a content piece for each.

          **8. Actionable Strategic Recommendations**
          - Based on all the analysis above, provide a final, prioritized list of next steps for the SEO and content team.
          - Be specific. Instead of "improve content," write "Expand the '[Location-Based Page]' to include a local ranking and testimonials from [Location]-based clients."
          - Structure this as a checklist of 5-7 key actions to take in the next quarter.`
      }
    ];

    // Check if the knowledge graph is too large for the model context
    const graphJsonString = JSON.stringify(consolidatedGraph, null, 2);
    if (graphJsonString.length > 100000) {
      console.warn(`Knowledge graph JSON is very large (${graphJsonString.length} characters). This might exceed the AI model's context window and cause errors.`);
    }
    return await this.queryOpenRouter(model, messages, 0.7);
  }

  async scoreQueryRelevance(query: string, centralEntity: string, model: string): Promise<number> {
    const messages = [
      {
        role: 'system',
        content: 'You are a semantic relevance scoring system. Rate query relevance to a core topic and respond with ONLY a number between 0.0 and 1.0.'
      },
      {
        role: 'user',
        content: `Rate the semantic relevance of the following QUERY to the CORE TOPIC on a scale from 0.0 to 1.0. Respond with ONLY the number.

CORE TOPIC: "${centralEntity}"
QUERY: "${query}"`
      }
    ];

    try {
      const response = await this.queryOpenRouter(model, messages, 0.1);
      const score = parseFloat(response.trim());
      return isNaN(score) ? 0.0 : Math.max(0.0, Math.min(1.0, score));
    } catch (error) {
      console.error('Error scoring query relevance:', error);
      return 0.0;
    }
  }
}