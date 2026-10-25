// Runs before every test file. Integration tests use an isolated database so
// they never touch the dev database. Replace/add TEST_DATABASE_URL as needed.
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://chairunnisa@localhost:5432/optic_luxe_test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret-for-local-runs';
