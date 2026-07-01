-- Adiciona data de nascimento e estado (UF) ao cadastro de usuários.
-- idade é mantida por compatibilidade e passa a ser calculada a partir
-- de data_nascimento no momento do registro.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS data_nascimento DATE,
  ADD COLUMN IF NOT EXISTS estado CHAR(2);
