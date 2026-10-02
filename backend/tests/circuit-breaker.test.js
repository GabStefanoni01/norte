const { CircuitBreaker } = require('../src/utils/circuit-breaker');

describe('circuit breaker', () => {
  it('abre após atingir o limite de falhas', async () => {
    const circuit = new CircuitBreaker({
      name: 'teste',
      failureThreshold: 2,
      resetTimeoutMs: 10_000,
    });

    const falhar = jest.fn().mockRejectedValue(new Error('falha externa'));

    await expect(circuit.executar(falhar)).rejects.toThrow('falha externa');
    await expect(circuit.executar(falhar)).rejects.toThrow('falha externa');

    expect(circuit.snapshot().state).toBe('open');
    expect(falhar).toHaveBeenCalledTimes(2);

    await expect(circuit.executar(falhar)).rejects.toMatchObject({ code: 'CIRCUIT_OPEN' });
    expect(falhar).toHaveBeenCalledTimes(2);
  });

  it('fecha novamente após recuperação no estado half-open', async () => {
    const circuit = new CircuitBreaker({
      name: 'teste',
      failureThreshold: 1,
      resetTimeoutMs: 10,
    });

    await expect(circuit.executar(() => Promise.reject(new Error('falha')))).rejects.toThrow();
    expect(circuit.snapshot().state).toBe('open');

    await new Promise((resolve) => setTimeout(resolve, 15));

    await expect(circuit.executar(() => Promise.resolve('ok'))).resolves.toBe('ok');
    expect(circuit.snapshot().state).toBe('closed');
    expect(circuit.snapshot().failures).toBe(0);
  });
});
