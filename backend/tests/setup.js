/**
 * Setup global para os testes
 * Rodado antes de todos os testes
 */

// Mock de variáveis de ambiente
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret-key-very-long-123456';
process.env.PORT = '3001';

// Suppress console logs durante testes (opcional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
