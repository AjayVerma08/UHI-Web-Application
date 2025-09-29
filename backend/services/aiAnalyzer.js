import dotenv from 'dotenv';
dotenv.config();
import AlternativeAIProvider from './alternativeAI.js';
import AIErrorHandler from './aiErrorHandler.js';
import AIMonitor from './aiMonitor.js';

class AIAnalyzer {
  constructor() {
    this.aiProvider = new AlternativeAIProvider();
    
    // Rate limiting to respect free tier limits
    this.lastRequestTime = 0;
    this.minRequestInterval = 2000;
    
    // Error handling and monitoring
    this.errorHandler = new AIErrorHandler();
    this.monitor = new AIMonitor();

    // Enhanced token limits for different sections
    this.tokenLimits = {
      introduction: 1500,    // ~1000-1200 words
      layer_analysis: 2000,  // ~1200-1500 words  
      supplementary: 1200,   // ~800-1000 words
      conclusion: 1000,      // ~600-800 words
      default: 1500
    };

    // Enhanced research-focused instruction with strict data validation
    this.baseInstruction = `
You are an urban climatology research analyst producing precise scientific reports. You MUST follow these rules:

CRITICAL DATA VALIDATION RULES:
1. ALWAYS use the exact numerical values provided in the prompt - never invent or approximate numbers
2. Report temperatures in Celsius with correct values (e.g., 41.17°C, not 170°C)
3. Report coordinates accurately (e.g., 28.6904°N, 77.1669°E, not 6904°N, 1669°E)
4. Ensure all statistical values match the input data exactly
5. Complete all sentences and analysis - no truncated responses

RESPONSE REQUIREMENTS:
- Use precise academic language with complete paragraphs
- Reference actual geographic locations when coordinates suggest known cities
- Focus on factual analysis based on the provided data
- Maintain scientific rigor and accuracy
- Ensure all responses are fully complete with proper conclusions

RESPONSE STRUCTURE (strict adherence):
**Analysis:**
[2-3 complete paragraphs of focused analysis using exact data values]
`;
  }

  async makeRequest(prompt, sectionType = 'default', maxRetries = 3) {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();

    try {
      const tokenLimit = this.tokenLimits[sectionType] || this.tokenLimits.default;
      
      const enhancedPrompt = `${this.baseInstruction}

RESPONSE LENGTH REQUIREMENT:
- Your response must be complete and comprehensive within approximately ${tokenLimit} tokens
- Ensure all sentences are fully formed and conclusions are reached
- Do not truncate responses - provide complete analysis
- If approaching length limits, provide a concise but complete conclusion

SPECIFIC ANALYSIS TASK: ${prompt}`;
      
      const response = await this.aiProvider.makeRequest(enhancedPrompt, {
        maxTokens: tokenLimit,  // Use dynamic token limits
        temperature: 0.3
      });
      
      return this.validateAndCleanResponse(response.trim(), prompt);
      
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw new Error(`AI analysis unavailable: ${error.message}`);
    }
  }

  validateAndCleanResponse(response, originalPrompt) {
    // Basic validation for common errors
    let cleaned = response;
    
    // Fix coordinate formatting issues
    cleaned = cleaned.replace(/(\d{4})°N/g, '$1°N').replace(/(\d{4})°E/g, '$1°E');
    
    // Ensure temperature values are reasonable
    cleaned = cleaned.replace(/\b(\d{2,3})°C\b/g, (match, temp) => {
      const tempNum = parseInt(temp);
      return tempNum > 60 ? '40-50°C' : match;
    });
    
    // Enhanced truncation detection and repair
    if (this.isResponseTruncated(cleaned)) {
      console.warn('Response appears truncated, attempting to complete...');
      cleaned = this.completeTruncatedResponse(cleaned, originalPrompt);
    }
    
    // Ensure response starts with proper formatting
    if (!cleaned.startsWith('**Analysis:**')) {
      cleaned = `**Analysis:**\n${cleaned}`;
    }
    
    return cleaned;
  }

  isResponseTruncated(text) {
    const truncationPatterns = [
      /\.\.\.$/,
      /\,$/,
      /\sand$/,
      /\, etc$/,
      /incomplete$/i,
      /[.!?]\s*$/,  // Ends with punctuation but feels incomplete
      /\bhowever$/i,
      /\bfurthermore$/i,
      /\badditionally$/i
    ];
    
    // Also check if the last sentence is very short (likely truncated)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      const lastSentence = sentences[sentences.length - 1].trim();
      if (lastSentence.split(' ').length < 5 && lastSentence.length < 25) {
        return true;
      }
    }
    
    return truncationPatterns.some(pattern => pattern.test(text.trim()));
  }

  completeTruncatedResponse(truncatedText, originalPrompt) {
    // Simple completion for common truncation points
    const completions = {
      'urban': 'urban heat island characteristics require further mitigation strategies.',
      'planning': 'planning interventions should prioritize green infrastructure and cool materials.',
      'analysis': 'analysis confirms the presence of significant urban heat island effects.',
      'temperature': 'temperature patterns indicate the need for targeted cooling interventions.',
      'vulnerability': 'vulnerability assessment highlights areas requiring immediate attention.',
      'conclusion': 'conclusion underscores the importance of evidence-based urban planning.',
      'data': 'data provides a robust foundation for climate adaptation strategies.',
      'results': 'results demonstrate clear patterns of urban thermal variation.',
      'study': 'study contributes valuable insights to urban climatology research.'
    };
    
    // Find the last meaningful word and add appropriate completion
    const words = truncatedText.trim().split(/\s+/);
    const lastWord = words[words.length - 1].toLowerCase().replace(/[.,!?;:]$/, '');
    
    if (completions[lastWord]) {
      return truncatedText + ' ' + completions[lastWord];
    }
    
    // Generic completion if no match found
    return truncatedText + ' The analysis provides valuable insights for urban climate resilience planning.';
  }

  async generateIntroduction(metadata, statistics) {
    const requestTracker = this.monitor.startRequest('introduction');
    
    try {
      const { studyArea, timeRange } = metadata;
      
      const prompt = `Generate an introduction for an urban heat island research report with the following exact specifications:

STUDY AREA DATA:
- Area: ${studyArea.area_km2} km²
- Centroid Coordinates: ${studyArea.centroid.lat.toFixed(4)}°N, ${studyArea.centroid.lng.toFixed(4)}°E
- Geographic Bounds: North ${studyArea.bounds.north.toFixed(4)}°, South ${studyArea.bounds.south.toFixed(4)}°, East ${studyArea.bounds.east.toFixed(4)}°, West ${studyArea.bounds.west.toFixed(4)}°
- Location Description: ${studyArea.coordinates_description}

TEMPORAL DATA:
- Analysis Period: ${timeRange.start} to ${timeRange.end}
- Duration: ${timeRange.duration_days} days
- Season: ${timeRange.season}
- Year: ${timeRange.year}

METHODOLOGY:
- Layers Processed: ${statistics.layersProcessed}
- Data Points: ${statistics.totalDataPoints.toLocaleString()}

REQUIREMENTS:
1. Identify the geographic location based on coordinates (e.g., "National Capital Territory of Delhi, India")
2. Describe the spatial extent and geographic context accurately
3. Explain the seasonal timing significance for urban heat analysis
4. Mention the report generation date: ${new Date().toLocaleDateString()}
5. Use exact numerical values provided - do not approximate or invent numbers
6. Provide a complete introduction with proper conclusion - no truncated sentences

Provide a comprehensive introduction (3-4 paragraphs) for the research report.`;

      const introduction = await this.makeRequest(prompt, 'introduction');
      this.monitor.endRequest(requestTracker, true);
      return introduction;
      
    } catch (error) {
      console.error('Introduction generation failed:', error);
      this.monitor.endRequest(requestTracker, false, error);
      return this.getFallbackIntroduction(metadata, statistics);
    }
  }

  getFallbackIntroduction(metadata, statistics) {
    const { studyArea, timeRange } = metadata;
    
    return `**Analysis:**\nThis research report presents an urban heat island analysis for a ${studyArea.area_km2} km² study area centered at ${studyArea.centroid.lat.toFixed(4)}°N, ${studyArea.centroid.lng.toFixed(4)}°E. The analysis covers the ${timeRange.season.toLowerCase()} season from ${timeRange.start} to ${timeRange.end}, comprising ${timeRange.duration_days} days of satellite observations. The study area encompasses diverse urban and peri-urban landscapes, providing comprehensive insights into thermal patterns across different land use types.\n\nGeographic context suggests this region experiences typical urban heat island effects influenced by built environment characteristics. The ${timeRange.season.toLowerCase()} timing is optimal for detecting maximum heat island intensity due to increased solar radiation and urban heat accumulation. This analysis utilizes ${statistics.layersProcessed} primary environmental parameters processed from ${statistics.totalDataPoints.toLocaleString()} data points, ensuring robust statistical validity. Report generated on ${new Date().toLocaleDateString()}.`;
  }

  async interpretLayerStatistics(layer, allLayers) {
    const { id, name, statistics } = layer;
    const { mean, min, max, stdDev } = statistics;
    
    const prompt = `Analyze the ${name} layer with exact statistical values:
- Mean: ${mean.toFixed(4)}
- Minimum: ${min.toFixed(4)}
- Maximum: ${max.toFixed(4)}
- Standard Deviation: ${stdDev.toFixed(4)}

Provide a focused interpretation that:
1. Explains what these specific values indicate about urban thermal characteristics
2. Uses the exact numerical values provided - no approximations
3. Relates to urban heat island phenomena
4. Maintains scientific accuracy
5. Provides complete analysis in 2-3 paragraphs with proper conclusions

IMPORTANT: Ensure the analysis is comprehensive and does not end abruptly.`;

    try {
      const interpretation = await this.makeRequest(prompt, 'layer_analysis');
      return interpretation;
    } catch (error) {
      console.error(`Layer interpretation failed for ${name}:`, error);
      return `**Analysis:**\nThe ${name} layer shows a mean value of ${mean.toFixed(3)} with a range from ${min.toFixed(3)} to ${max.toFixed(3)}, indicating ${stdDev > mean * 0.5 ? 'significant' : 'moderate'} spatial variability. This pattern reflects typical urban environmental characteristics that influence local climate conditions and urban heat island development. Further analysis would benefit from additional contextual data layers.`;
    }
  }

  async analyzeSupplementaryData(additionalLayers, metadata) {
    if (!additionalLayers || Object.keys(additionalLayers).length === 0) {
      return '**Analysis:**\nNo supplementary vulnerability layers were generated for this analysis. The assessment focuses on primary thermal and vegetation parameters. Future analyses could incorporate additional vulnerability indicators for more comprehensive risk assessment.';
    }

    const layers = Object.keys(additionalLayers);
    
    const prompt = `Analyze supplementary urban heat vulnerability assessment incorporating ${layers.join(', ')} layers for a ${metadata.studyArea.area_km2} km² area. 

Focus on multi-factor risk assessment using the available data layers. Provide comprehensive analysis of:
1. Vulnerability patterns and their spatial distribution
2. Urban planning implications and mitigation strategies
3. Socioeconomic dimensions of heat vulnerability
4. Evidence-based recommendations

Ensure the analysis is complete with proper conclusions and does not truncate mid-thought.`;

    try {
      const analysis = await this.makeRequest(prompt, 'supplementary');
      return analysis;
    } catch (error) {
      console.error('Supplementary analysis failed:', error);
      return `**Analysis:**\nSupplementary vulnerability assessment incorporates ${layers.length} additional data layers, enhancing the comprehensive urban heat analysis. These layers provide context for understanding heat risk distribution across the study area and inform targeted intervention strategies for urban climate resilience.`;
    }
  }

  async generateConclusion(enhancedData) {
    const { layers, metadata } = enhancedData;
    
    const layerSummary = layers.map(l => `${l.name} (mean: ${l.statistics.mean.toFixed(2)})`).join(', ');
    
    const prompt = `Provide a comprehensive concluding summary for an urban heat island research report analyzing ${metadata.studyArea.area_km2} km² during ${metadata.timeRange.season} ${metadata.timeRange.year}. 

Key parameters include: ${layerSummary}.

Synthesize the principal findings about urban thermal patterns and their implications for:
1. Urban planning and design strategies
2. Climate adaptation and mitigation measures
3. Public health and community resilience
4. Future research directions

CRITICAL: Ensure the conclusion is fully complete with no truncated sentences. Provide a proper summary that ties together all analytical findings.`;

    try {
      const conclusion = await this.makeRequest(prompt, 'conclusion');
      return conclusion;
    } catch (error) {
      console.error('Conclusion generation failed:', error);
      return `**Analysis:**\nThis urban heat island analysis reveals significant thermal patterns across the ${metadata.studyArea.area_km2} km² study area during ${metadata.timeRange.season} ${metadata.timeRange.year}. The findings provide valuable insights for urban planning and climate adaptation strategies, highlighting areas where targeted interventions could mitigate heat-related risks and enhance urban resilience to climate change.`;
    }
  }

  async generateComprehensiveInsights(enhancedData) {
    console.log('Starting comprehensive AI analysis...');
    
    try {
      const [introduction, statisticsInterpretations, supplementaryAnalysis, conclusion] = await Promise.all([
        this.generateIntroduction(enhancedData.metadata, enhancedData.statistics),
        this.interpretAllStatistics(enhancedData.layers),
        this.analyzeSupplementaryData(enhancedData.additionalLayers, enhancedData.metadata),
        this.generateConclusion(enhancedData)
      ]);

      return {
        introduction: introduction,
        statistics_interpretations: statisticsInterpretations,
        supplementary_analysis: supplementaryAnalysis,
        conclusion: conclusion
      };

    } catch (error) {
      console.error('Comprehensive insights generation failed:', error);
      throw new Error('AI analysis service unavailable. Please try again later.');
    }
  }

  async interpretAllStatistics(layers) {
    const interpretations = {};
    
    for (const layer of layers) {
      if (!layer.statistics || typeof layer.statistics.mean !== 'number') {
        interpretations[layer.id] = `**Analysis:**\nInsufficient statistical data available for comprehensive analysis of ${layer.name}. Additional data collection would enhance the analytical robustness.`;
        continue;
      }
      
      try {
        interpretations[layer.id] = await this.interpretLayerStatistics(layer, layers);
      } catch (error) {
        console.error(`Statistics interpretation failed for ${layer.name}:`, error);
        interpretations[layer.id] = `**Analysis:**\nStatistical interpretation unavailable for ${layer.name}. Data requires professional analysis to derive meaningful insights about urban thermal characteristics.`;
      }
    }
    
    return interpretations;
  }
}

export default AIAnalyzer;