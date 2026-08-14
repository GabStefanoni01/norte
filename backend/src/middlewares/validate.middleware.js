/**
 * Middleware para validação de dados de entrada
 * Uso: app.post('/rota', validar({ email: 'email', senha: 'senha' }), controller)
 */

const {
  ValidadorEmail,
  ValidadorSenha,
  ValidadorNome,
  ValidadorTitulo,
  ValidadorConteudo,
  ValidadorData,
  ValidadorIdade,
  ValidadorURL,
  ValidadorPrioridade,
  ValidadorStatus,
  ValidadorNumero,
  ValidadorCPF,
  ValidadorLista,
} = require('../utils/validators');

/**
 * Mapa de validadores disponíveis
 */
const VALIDADORES = {
  email: ValidadorEmail.validar,
  senha: (val) => ValidadorSenha.validar(val, 8, true),
  senhaSimples: (val) => ValidadorSenha.validar(val, 8, false),
  nome: ValidadorNome.validar,
  titulo: ValidadorTitulo.validar,
  conteudo: ValidadorConteudo.validar,
  data: ValidadorData.validar,
  idade: ValidadorIdade.validar,
  url: ValidadorURL.validar,
  prioridade: ValidadorPrioridade.validar,
  status: ValidadorStatus.validar,
  numero: ValidadorNumero.validar,
  cpf: ValidadorCPF.validar,
  lista: ValidadorLista.validar,
};

/**
 * Factory para criar um middleware de validação
 * 
 * Uso:
 * app.post('/login', validar({ email: 'email', senha: 'senha' }), controller)
 * app.post('/post', validar({ titulo: 'titulo', conteudo: 'conteudo' }), controller)
 * 
 * @param {Object} esquema - Mapear de { campo: 'tipo_validador' }
 * @returns {Function} Middleware
 */
function validar(esquema) {
  return (req, res, next) => {
    const erros = [];
    const dados = req.body || {};

    Object.keys(esquema).forEach((campo) => {
      const tipoValidador = esquema[campo];
      const valor = dados[campo];
      const validador = VALIDADORES[tipoValidador];

      if (!validador) {
        erros.push(`Validador desconhecido: ${tipoValidador}`);
        return;
      }

      const resultado = validador(valor);

      if (!resultado.valido) {
        erros.push(resultado.erro);
      }
    });

    if (erros.length > 0) {
      return res.status(400).json({
        sucesso: false,
        dados: null,
        erro: 'Validação falhou',
        detalhes: erros,
      });
    }

    next();
  };
}

/**
 * Middleware customizado com lógica complexa de validação
 * 
 * Uso:
 * app.post('/criar', validarCustomizado((req) => {
 *   if (req.body.email === req.body.emailConfirmacao) {
 *     throw new Error('Emails não conferem');
 *   }
 * }), controller)
 */
function validarCustomizado(funcaoValidacao) {
  return async (req, res, next) => {
    try {
      await funcaoValidacao(req);
      next();
    } catch (erro) {
      return res.status(400).json({
        sucesso: false,
        dados: null,
        erro: erro.message || 'Validação personalizada falhou',
      });
    }
  };
}

/**
 * Middleware para sanitizar strings e prevenir XSS
 */
function sanitizar() {
  return (req, res, next) => {
    const sanitizarString = (str) => {
      if (typeof str !== 'string') return str;
      
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    };

    const sanitizarObj = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj;

      const resultado = Array.isArray(obj) ? [] : {};

      Object.keys(obj).forEach((chave) => {
        const valor = obj[chave];
        
        if (typeof valor === 'string') {
          resultado[chave] = sanitizarString(valor);
        } else if (typeof valor === 'object' && valor !== null) {
          resultado[chave] = sanitizarObj(valor);
        } else {
          resultado[chave] = valor;
        }
      });

      return resultado;
    };

    if (req.body) {
      req.body = sanitizarObj(req.body);
    }

    next();
  };
}

module.exports = {
  validar,
  validarCustomizado,
  sanitizar,
  VALIDADORES,
};
