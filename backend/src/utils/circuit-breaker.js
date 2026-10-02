const logger = require('./logger');

class CircuitBreaker {
  constructor({
    name,
    failureThreshold = 3,
    resetTimeoutMs = 30_000,
  }) {
    if (!name) throw new Error('Circuit breaker name is required');

    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.failures = 0;
    this.state = 'closed';
    this.openedAt = null;
  }

  getState() {
    if (this.state === 'open' && Date.now() - this.openedAt >= this.resetTimeoutMs) {
      this.state = 'half-open';
    }
    return this.state;
  }

  async executar(fn) {
    const state = this.getState();

    if (state === 'open') {
      const error = new Error(`Circuito ${this.name} temporariamente aberto`);
      error.code = 'CIRCUIT_OPEN';
      throw error;
    }

    try {
      const result = await fn();
      this.registrarSucesso();
      return result;
    } catch (err) {
      this.registrarFalha(err);
      throw err;
    }
  }

  registrarSucesso() {
    const anterior = this.state;
    this.failures = 0;
    this.state = 'closed';
    this.openedAt = null;

    if (anterior === 'half-open') {
      logger.info('circuit_breaker.closed', { name: this.name });
    }
  }

  registrarFalha(err) {
    this.failures += 1;

    if (this.state === 'half-open' || this.failures >= this.failureThreshold) {
      this.state = 'open';
      this.openedAt = Date.now();

      logger.error('circuit_breaker.opened', err, {
        name: this.name,
        failures: this.failures,
        failureThreshold: this.failureThreshold,
      });
    }
  }

  snapshot() {
    return {
      name: this.name,
      state: this.getState(),
      failures: this.failures,
      failureThreshold: this.failureThreshold,
      resetTimeoutMs: this.resetTimeoutMs,
    };
  }

  reset() {
    this.failures = 0;
    this.state = 'closed';
    this.openedAt = null;
  }
}

module.exports = { CircuitBreaker };
