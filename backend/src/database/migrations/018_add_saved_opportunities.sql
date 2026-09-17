-- Permite que cada usuário salve oportunidades para consultar depois.
-- A restrição única evita duplicidade e o CASCADE remove os salvos quando
-- o usuário ou a oportunidade forem excluídos.

CREATE TABLE IF NOT EXISTS saved_opportunities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_saved_opportunities_user_opportunity UNIQUE (user_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_opportunities_user_created
  ON saved_opportunities(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_opportunities_opportunity
  ON saved_opportunities(opportunity_id);
