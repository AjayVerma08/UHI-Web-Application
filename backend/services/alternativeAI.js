import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';

class AlternativeAIProvider {
  constructor(config = {}) {
    this.providers = {
      ollama: {
        baseURL: config.ollamaURL || 'http://localhost:11434',
        model: config.ollamaModel || 'llama2:7b',
        available: false
      },
      openrouter: {
        baseURL: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'microsoft/wizardlm-2-8x22b',
        available: !!process.env.OPENROUTER_API_KEY
      }
    };
    
    this.currentProvider = 'openrou';
    this.initializeProviders();
  }

  async initializeProviders() {
    // Check Ollama availability
    try {
      await axios.get(`${this.providers.ollama.baseURL}/api/tags`, { timeout: 3000 });
      this.providers.ollama.available = true;
      console.log('Ollama local AI detected and available');
    } catch (error) {
      console.log('Ollama not available, using cloud services');
    }
  }

  async makeRequest(prompt, options = {}) {
    const providers = ['ollama', 'huggingface', 'openrouter'].filter(
      p => this.providers[p].available
    );

    if (providers.length === 0) {
      throw new Error('No AI providers available - please check API keys or install Ollama');
    }

    for (const providerName of providers) {
      try {
        return await this.requestFromProvider(providerName, prompt, options);
      } catch (error) {
        console.warn(`${providerName} failed:`, error.message);
        continue;
      }
    }
    
    throw new Error('All AI providers failed');
  }

  async requestFromProvider(providerName, prompt, options) {
    const provider = this.providers[providerName];
    
    switch (providerName) {
      case 'ollama':
        return this.requestOllama(provider, prompt, options);
      case 'huggingface':
        return this.requestHuggingFace(provider, prompt, options);
      case 'openrouter':
        return this.requestOpenRouter(provider, prompt, options);
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }

  async requestOllama(provider, prompt, options) {
    const response = await axios.post(
      `${provider.baseURL}/api/generate`,
      {
        model: provider.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || 200
        }
      },
      { timeout: 30000 }
    );

    return response.data.response;
  }

  async requestHuggingFace(provider, prompt, options) {
    const response = await axios.post(
      `${provider.baseURL}/${provider.model}`,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: options.maxTokens || 200,
          temperature: options.temperature || 0.7,
          do_sample: true,
          return_full_text: false
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    if (response.data && response.data[0] && response.data[0].generated_text) {
      return response.data[0].generated_text.trim();
    }
    
    throw new Error('Invalid HuggingFace response');
  }

  async requestOpenRouter(provider, prompt, options) {
    const response = await axios.post(
      provider.baseURL,
      {
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 200,
        temperature: options.temperature || 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.choices[0].message.content;
  }
}

export default AlternativeAIProvider;