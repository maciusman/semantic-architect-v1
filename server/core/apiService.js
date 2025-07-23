/**
 * ApiService - Service for handling external API communications
 * Converted from TypeScript to JavaScript for Node.js backend
 */

class ApiService {
  constructor(apiKeys) {
    this.apiKeys = apiKeys;
  }

  async fetchOpenRouterModels() {
    try {
      if (!this.apiKeys.openrouter) {
        throw new Error('OpenRouter API key is required');
      }

      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.openrouter}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
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

  async queryOpenRouter(model, messages, temperature = 0.7) {
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

  async performQueryExpansion(centralEntity, businessContext, language, count, model) {
    const messages = [
      {
        role: 'system',
        content: `You are an expert SEO and content strategist. Generate diverse, relevant search queries for comprehensive content analysis.`
      },
      {
        role: 'user',
        content: `
          Central Entity: "${centralEntity}"
          Business Context: "${businessContext}"
          Language: ${language}
          
          Generate exactly ${count} diverse, relevant search queries that would help understand this topic comprehensively. Consider:
          - Different aspects and perspectives
          - User intent variations (informational, commercial, navigational)
          - Related subtopics and categories
          - Long-tail variations
          
          Respond with ONLY the queries, one per line, in ${language} language.
        `
      }
    ];

    const response = await this.queryOpenRouter(model, messages);
    return response.split('\n').filter(line => line.trim()).slice(0, count);
  }

  async searchSerp(query, language, location, count) {
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
      
      // Extract results from the correct nested structure
      const results = data.data?.data?.results?.organic_results || [];
      console.log('Extracted results:', results);
      
      return results.slice(0, count);
    } catch (error) {
      console.error('Error searching SERP:', error);
      throw error;
    }
  }

  async scrapeContent(url) {
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

  async extractKnowledgeGraph(content, centralEntity, url, model) {
    const messages = [
      {
        role: 'system',
        content: `ROLE: You are a precision knowledge graph extraction system. Your task is to analyze content and output ONLY a valid JSON object representing the semantic knowledge within.`
      },
      {
        role: 'user',
        content: `BUSINESS CONTEXT: Professional medical/dental industry content analysis.

RULES AND EXCLUSIONS (CRITICAL!):
- IGNORE AND DO NOT CREATE ENTITIES FOR: anything related to website cookies (e.g., _ga, PHPSESSID, CookieConsent), cookie categories (e.g., Necessary Cookies), privacy policies, user actions (e.g., login, register, cart), website features, navigation elements, or general IT service providers (e.g., Google, Amazon, Meta, Cookiebot, Edrone) unless they are directly a manufacturer or distributor in the medical/dental field.
- FOCUS EXCLUSIVELY ON: entities directly relevant to the Business Context and the Central Entity "${centralEntity}". This includes:
  - Medical and dental products, instruments, and materials.
  - Brands and manufacturers in the dental industry (e.g., Poldent, VDW, Endostar).
  - Medical procedures and dental specialties (e.g., Endodontics, Root Canal Treatment).
  - Product categories and subcategories.
  - Key features and properties of medical products.
  - Scientific concepts and technologies relevant to the field.
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
              "weight": 0.85
            }
          ]
        }`
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

  async generateTopicalMap(consolidatedGraph, centralEntity, businessContext, language, model) {
    const messages = [
      {
        role: 'system',
        content: `You are an expert content strategist and SEO specialist. Create comprehensive topical maps based on knowledge graphs.`
      },
      {
        role: 'user',
        content: `
          Create a comprehensive topical map for "${centralEntity}\" based on this knowledge graph.
          
          Business Context: "${businessContext}"
          Language: ${language}
          
          Knowledge Graph:
          ${JSON.stringify(consolidatedGraph, null, 2)}
          
          Create a well-structured topical map in Markdown format that includes:
          
          1. **Executive Summary** - Overview of the topic landscape
          2. **Core Topic Clusters** - Main thematic groups with subtopics
          3. **Content Opportunities** - Specific content ideas and angles
          4. **Semantic Relationships** - How topics connect and relate
          5. **Content Gap Analysis** - Missing areas to explore
          6. **Strategic Recommendations** - Next steps for content strategy
          
          Use proper Markdown formatting with headers, lists, and emphasis. Write in ${language} language.
          Focus on actionable insights for content creation and SEO strategy.
        `
      }
    ];

    // Check if the knowledge graph is too large for the model context
    const graphJsonString = JSON.stringify(consolidatedGraph, null, 2);
    if (graphJsonString.length > 100000) {
      console.warn(`Knowledge graph JSON is very large (${graphJsonString.length} characters). This might exceed the AI model's context window and cause errors.`);
    }
    return await this.queryOpenRouter(model, messages, 0.7);
  }
}

module.exports = { ApiService };