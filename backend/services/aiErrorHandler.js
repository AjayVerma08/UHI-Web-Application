class AIErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.maxErrorsPerType = 5;
    this.cooldownPeriod = 300000; // 5 minutes
    this.lastErrorTime = new Map();
  }

  shouldRetryRequest(errorType) {
    const now = Date.now();
    const errorCount = this.errorCounts.get(errorType) || 0;
    const lastError = this.lastErrorTime.get(errorType) || 0;

    // Reset error count after cooldown period
    if (now - lastError > this.cooldownPeriod) {
      this.errorCounts.set(errorType, 0);
      return true;
    }

    return errorCount < this.maxErrorsPerType;
  }

  recordError(errorType, error) {
    const now = Date.now();
    const currentCount = this.errorCounts.get(errorType) || 0;
    
    this.errorCounts.set(errorType, currentCount + 1);
    this.lastErrorTime.set(errorType, now);

    console.warn(`AI Error [${errorType}] #${currentCount + 1}:`, error.message);
  }

  getErrorSummary() {
    const summary = {};
    for (const [errorType, count] of this.errorCounts.entries()) {
      summary[errorType] = {
        count,
        lastOccurred: this.lastErrorTime.get(errorType)
      };
    }
    return summary;
  }

  reset() {
    this.errorCounts.clear();
    this.lastErrorTime.clear();
  }
}

export default AIErrorHandler;