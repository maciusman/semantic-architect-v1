// Types and interfaces for the backend (converted from TypeScript)

// Since we're using JavaScript now, we'll use JSDoc comments for type documentation

/**
 * @typedef {Object} ApiKeys
 * @property {string} openrouter
 * @property {string} jina
 * @property {string} serpdata
 */

/**
 * @typedef {Object} ProjectConfig
 * @property {string} name
 * @property {string} centralEntity
 * @property {string} businessContext
 * @property {string} language
 * @property {string} location
 */

/**
 * @typedef {Object} AutoUrlConfig
 * @property {string} mainQuery
 * @property {number} queryExpansionCount
 * @property {number} urlsPerQuery
 */

/**
 * @typedef {Object} ManualUrlConfig
 * @property {string[]} urls
 */

/**
 * @typedef {Object} ModelConfig
 * @property {string} extractionModel
 * @property {string} synthesisModel
 */

/**
 * @typedef {Object} AppConfig
 * @property {ProjectConfig} project
 * @property {'auto'|'manual'} urlSource
 * @property {AutoUrlConfig} autoConfig
 * @property {ManualUrlConfig} manualConfig
 * @property {ModelConfig} models
 */

/**
 * @typedef {Object} LogEntry
 * @property {string} id
 * @property {Date} timestamp
 * @property {'INFO'|'SUCCESS'|'ERROR'|'WARNING'} level
 * @property {string} message
 */

/**
 * @typedef {Object} ProcessResults
 * @property {string} topicalMap
 * @property {KnowledgeGraph} knowledgeGraph
 * @property {Array<{url: string, content: string}>} scrapedContent
 * @property {Object} metadata
 */

/**
 * @typedef {Object} OpenRouterModel
 * @property {string} id
 * @property {string} name
 * @property {number} context_length
 * @property {Object} pricing
 */

/**
 * @typedef {Object} SerpResult
 * @property {number} position
 * @property {string} title
 * @property {string} link
 * @property {string} snippet
 */

/**
 * @typedef {Object} KnowledgeGraphNode
 * @property {string} id
 * @property {string} label
 * @property {string} type
 * @property {Object} properties
 */

/**
 * @typedef {Object} KnowledgeGraphEdge
 * @property {string} source
 * @property {string} target
 * @property {string} relationship
 * @property {number} weight
 */

/**
 * @typedef {Object} KnowledgeGraph
 * @property {KnowledgeGraphNode[]} nodes
 * @property {KnowledgeGraphEdge[]} edges
 */

module.exports = {
  // Export for JSDoc reference - actual values will be used in other files
};