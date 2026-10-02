const logger = require('./logger');

class CircuitBreaker {
  constructor({
    name,
    failureThreshold = 3,
    resetTimeoutMs = 30_000,
    shouldCountFailure = () => true,
  }) {
    if (!name) throw new Error('Circuit breaker name is required');

    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.shouldCountFailure = shouldCountFailure;
    this.failures = 0;
    this.state = 'closed';
    this.openedAt = null;
    this.halfOpenInFlight = false;
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

    if (state === 'half-open') {
      if (this.halfOpenInFlight) {
        const error = new Error(`Circuito ${this.name} aguardando recuperação`);
        error.code = 'CIRCUIT_HALF_OPEN';
        throw error;
      }
      this.halfOpenInFlight = true;
    }

    try {
      const result = await fn();
      this.registrarSucesso();
      return result;
    } catch (err) {
      this.registrarFalha(err);
      throw err;
    } finally {
      if (state === 'half-open') this.halfOpenInFlight = false;
    }
  }

  registrarSucesso() {
    const anterior = this.state;
    this.failures = 0;
    this.state = 'closed';
    this.openedAt = null;
    this.halfOpenInFlight = false;

    if (anterior === 'half-open') {
      logger.info('circuit_breaker.closed', { name: this.name });
    }
  }

  registrarFalha(err) {
    if (!this.shouldCountFailure(err)) {
      if (this.state === 'half-open') {
        this.state = 'open';
        this.openedAt = Date.now();
        logger.warn('circuit_breaker.recovery_failed', {
          name: this.name,
          errorCode: err?.code,
        });
      }
      return;
    }

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
    this.halfOpenInFlight = false;
  }
}

module.exports = { CircuitBreaker };
