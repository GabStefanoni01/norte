const { CircuitBreaker } = require('../src/utils/circuit-breaker');

describe('circuit breaker', () => {
  it('abre após atingir o limite de falhas', async () => {
    const circuit = new CircuitBreaker({ name: 'teste', failureThreshold: 2, resetTimeoutMs: 10_000 });
    const falhar = jest.fn().mockRejectedValue(new Error('falha externa'));

    await expect(circuit.executar(falhar)).rejects.toThrow('falha externa');
    await expect(circuit.executar(falhar)).rejects.toThrow('falha externa');
    expect(circuit.snapshot().state).toBe('open');
    await expect(circuit.executar(falhar)).rejects.toMatchObject({ code: 'CIRCUIT_OPEN' });
    expect(falhar).toHaveBeenCalledTimes(2);
  });

  it('não abre para falha não transitória quando configurado', async () => {
    const circuit = new CircuitBreaker({ name: 'teste', failureThreshold: 1, shouldCountFailure: (err) => err?.status >= 500 });
    await expect(circuit.executar(() => Promise.reject(Object.assign(new Error('não autorizado'), { status: 401 })))).rejects.toThrow();
    expect(circuit.snapshot().state).toBe('closed');
    expect(circuit.snapshot().failures).toBe(0);
  });

  it('fecha novamente após recuperação no estado half-open', async () => {
    const circuit = new CircuitBreaker({ name: 'teste', failureThreshold: 1, resetTimeoutMs: 10 });
    await expect(circuit.executar(() => Promise.reject(new Error('falha')))).rejects.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 15));
    await expect(circuit.executar(() => Promise.resolve('ok'))).resolves.toBe('ok');
    expect(circuit.snapshot().state).toBe('closed');
  });

  it('permite apenas uma tentativa de recuperação simultânea', async () => {
    const circuit = new CircuitBreaker({ name: 'teste', failureThreshold: 1, resetTimeoutMs: 10 });
    await expect(circuit.executar(() => Promise.reject(new Error('falha')))).rejects.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 15));

    let liberar;
    const bloqueio = new Promise((resolve) => { liberar = resolve; });
    const primeira = circuit.executar(() => bloqueio.then(() => 'ok'));

    await expect(circuit.executar(() => Promise.resolve('segunda'))).rejects.toMatchObject({ code: 'CIRCUIT_HALF_OPEN' });
    liberar();
    await expect(primeira).resolves.toBe('ok');
    expect(circuit.snapshot().state).toBe('closed');
  });
});
