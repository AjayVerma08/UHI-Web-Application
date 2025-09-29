import fs from 'fs';
import path from 'path';

class AIMonitor {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      fallbackUsed: 0,
      averageResponseTime: 0,
      requestsByType: {},
      errorsByType: {}
    };
    
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  startRequest(type) {
    return {
      type,
      startTime: Date.now(),
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  endRequest(requestTracker, success, error = null, usedFallback = false) {
    const endTime = Date.now();
    const duration = endTime - requestTracker.startTime;
    
    // Update metrics
    this.metrics.totalRequests++;
    
    if (success && !usedFallback) {
      this.metrics.successfulRequests++;
    } else if (usedFallback) {
      this.metrics.fallbackUsed++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update request type counters
    if (!this.metrics.requestsByType[requestTracker.type]) {
      this.metrics.requestsByType[requestTracker.type] = { count: 0, totalTime: 0 };
    }
    this.metrics.requestsByType[requestTracker.type].count++;
    this.metrics.requestsByType[requestTracker.type].totalTime += duration;

    // Update error counters
    if (error) {
      if (!this.metrics.errorsByType[error.name || 'Unknown']) {
        this.metrics.errorsByType[error.name || 'Unknown'] = 0;
      }
      this.metrics.errorsByType[error.name || 'Unknown']++;
    }

    // Calculate average response time
    const totalTime = Object.values(this.metrics.requestsByType)
      .reduce((sum, type) => sum + type.totalTime, 0);
    this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;

    // Log the request
    this.logRequest({
      id: requestTracker.id,
      type: requestTracker.type,
      duration,
      success,
      usedFallback,
      error: error ? error.message : null,
      timestamp: new Date().toISOString()
    });
  }

  logRequest(requestData) {
    const logFile = path.join(this.logDir, `ai_requests_${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = `${requestData.timestamp} [${requestData.type}] ${requestData.id} - Duration: ${requestData.duration}ms, Success: ${requestData.success}, Fallback: ${requestData.usedFallback}${requestData.error ? `, Error: ${requestData.error}` : ''}\n`;
    
    fs.appendFileSync(logFile, logEntry);
  }

  getMetrics() {
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2)
      : 0;

    const fallbackRate = this.metrics.totalRequests > 0
      ? (this.metrics.fallbackUsed / this.metrics.totalRequests * 100).toFixed(2)
      : 0;

    return {
      ...this.metrics,
      successRate: `${successRate}%`,
      fallbackRate: `${fallbackRate}%`,
      averageResponseTime: `${this.metrics.averageResponseTime.toFixed(0)}ms`
    };
  }

  generateReport() {
    const metrics = this.getMetrics();
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalRequests: metrics.totalRequests,
        successRate: metrics.successRate,
        fallbackRate: metrics.fallbackRate,
        averageResponseTime: metrics.averageResponseTime
      },
      breakdown: {
        requestsByType: {},
        errorsByType: metrics.errorsByType
      }
    };

    // Calculate average time per request type
    Object.entries(metrics.requestsByType).forEach(([type, data]) => {
      report.breakdown.requestsByType[type] = {
        count: data.count,
        averageTime: `${(data.totalTime / data.count).toFixed(0)}ms`
      };
    });

    return report;
  }

  saveReport() {
    const report = this.generateReport();
    const reportFile = path.join(this.logDir, `ai_performance_report_${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    return reportFile;
  }

  reset() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      fallbackUsed: 0,
      averageResponseTime: 0,
      requestsByType: {},
      errorsByType: {}
    };
  }
}

export default AIMonitor;