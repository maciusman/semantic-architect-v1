import { ApiKeys, AppConfig } from '../types';

export class StorageService {
  private static readonly STORAGE_KEYS = {
    API_KEYS: 'semantic_architect_api_keys',
    APP_CONFIG: 'semantic_architect_config',
  };

  static saveApiKeys(apiKeys: ApiKeys): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.API_KEYS, JSON.stringify(apiKeys));
    } catch (error) {
      console.error('Error saving API keys:', error);
    }
  }

  static loadApiKeys(): ApiKeys {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.API_KEYS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
    
    return {
      openrouter: '',
      jina: '',
      serpdata: '',
    };
  }

  static saveConfig(config: AppConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.APP_CONFIG, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  static loadConfig(): Partial<AppConfig> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.APP_CONFIG);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
    
    return {};
  }

  static clearAll(): void {
    localStorage.removeItem(this.STORAGE_KEYS.API_KEYS);
    localStorage.removeItem(this.STORAGE_KEYS.APP_CONFIG);
  }
}