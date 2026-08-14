/**
 * Validadores reutilizáveis para o projeto Norte
 * 
 * Cada validador retorna um objeto: { valido: boolean, erro?: string }
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODIGO_REGEX = /^\d{6}$/;

// ==================== VALIDADORES BÁSICOS (LEGADO) ====================

function emailValido(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email) && email.length <= 150;
}

function senhaValida(senha) {
  return typeof senha === 'string' && senha.length >= 6 && senha.length <= 100;
}

function codigoValido(codigo) {
  return typeof codigo === 'string' && CODIGO_REGEX.test(codigo);
}

function nomeValido(nome) {
  return typeof nome === 'string' && nome.trim().length >= 2 && nome.length <= 150;
}

/**
 * Lança um erro 400 com a primeira mensagem de validação que falhar.
 * Uso: validarOuFalhar([[emailValido(email), 'E-mail inválido'], ...])
 */
function validarOuFalhar(checagens) {
  for (const [ok, mensagem] of checagens) {
    if (!ok) {
      const err = new Error(mensagem);
      err.status = 400;
      throw err;
    }
  }
}

// ==================== VALIDADORES NOVOS (COMPLETOS) ====================

class ValidadorEmail {
  static validar(email) {
    if (!email) {
      return { valido: false, erro: 'Email é obrigatório' };
    }

    if (typeof email !== 'string') {
      return { valido: false, erro: 'Email deve ser uma string' };
    }

    if (!EMAIL_REGEX.test(email)) {
      return { valido: false, erro: 'Email inválido' };
    }

    if (email.length > 150) {
      return { valido: false, erro: 'Email muito longo (máx 150 caracteres)' };
    }

    return { valido: true };
  }
}

class ValidadorSenha {
  static validar(senha, minimo = 8, requerirCaracteresEspeciais = true) {
    if (!senha) {
      return { valido: false, erro: 'Senha é obrigatória' };
    }

    if (typeof senha !== 'string') {
      return { valido: false, erro: 'Senha deve ser uma string' };
    }

    if (senha.length < minimo) {
      return { valido: false, erro: `Senha deve ter no mínimo ${minimo} caracteres` };
    }

    if (senha.length > 255) {
      return { valido: false, erro: 'Senha muito longa (máx 255 caracteres)' };
    }

    if (!/[A-Z]/.test(senha)) {
      return { valido: false, erro: 'Senha deve conter pelo menos uma maiúscula' };
    }

    if (!/[a-z]/.test(senha)) {
      return { valido: false, erro: 'Senha deve conter pelo menos uma minúscula' };
    }

    if (!/[0-9]/.test(senha)) {
      return { valido: false, erro: 'Senha deve conter pelo menos um número' };
    }

    if (requerirCaracteresEspeciais && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(senha)) {
      return { valido: false, erro: 'Senha deve conter pelo menos um caractere especial' };
    }

    return { valido: true };
  }
}

class ValidadorNome {
  static validar(nome) {
    if (!nome) {
      return { valido: false, erro: 'Nome é obrigatório' };
    }

    if (typeof nome !== 'string') {
      return { valido: false, erro: 'Nome deve ser uma string' };
    }

    const nomeLimpo = nome.trim();

    if (nomeLimpo.length < 3) {
      return { valido: false, erro: 'Nome deve ter no mínimo 3 caracteres' };
    }

    if (nomeLimpo.length > 150) {
      return { valido: false, erro: 'Nome deve ter no máximo 150 caracteres' };
    }

    if (!/^[a-záàâãéèêíïóôõöúçñA-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s'-]+$/.test(nomeLimpo)) {
      return { valido: false, erro: 'Nome contém caracteres inválidos' };
    }

    return { valido: true };
  }
}

class ValidadorTitulo {
  static validar(titulo, minimo = 5, maximo = 250) {
    if (!titulo) {
      return { valido: false, erro: 'Título é obrigatório' };
    }

    if (typeof titulo !== 'string') {
      return { valido: false, erro: 'Título deve ser uma string' };
    }

    const tituloLimpo = titulo.trim();

    if (tituloLimpo.length < minimo) {
      return { valido: false, erro: `Título deve ter no mínimo ${minimo} caracteres` };
    }

    if (tituloLimpo.length > maximo) {
      return { valido: false, erro: `Título deve ter no máximo ${maximo} caracteres` };
    }

    return { valido: true };
  }
}

class ValidadorConteudo {
  static validar(conteudo, minimo = 10, maximo = 5000) {
    if (!conteudo) {
      return { valido: false, erro: 'Conteúdo é obrigatório' };
    }

    if (typeof conteudo !== 'string') {
      return { valido: false, erro: 'Conteúdo deve ser uma string' };
    }

    const conteudoLimpo = conteudo.trim();

    if (conteudoLimpo.length < minimo) {
      return { valido: false, erro: `Conteúdo deve ter no mínimo ${minimo} caracteres` };
    }

    if (conteudoLimpo.length > maximo) {
      return { valido: false, erro: `Conteúdo deve ter no máximo ${maximo} caracteres` };
    }

    return { valido: true };
  }
}

class ValidadorData {
  static validar(data, permitirPassado = false) {
    if (!data) {
      return { valido: false, erro: 'Data é obrigatória' };
    }

    const dataObj = new Date(data);

    if (isNaN(dataObj.getTime())) {
      return { valido: false, erro: 'Data inválida' };
    }

    if (!permitirPassado) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      if (dataObj < hoje) {
        return { valido: false, erro: 'Data não pode ser no passado' };
      }
    }

    return { valido: true };
  }
}

class ValidadorIdade {
  static validar(idade) {
    if (idade === undefined || idade === null) {
      return { valido: true }; // Opcional
    }

    const idadeNum = Number(idade);

    if (isNaN(idadeNum)) {
      return { valido: false, erro: 'Idade deve ser um número' };
    }

    if (idadeNum < 13) {
      return { valido: false, erro: 'Idade mínima é 13 anos' };
    }

    if (idadeNum > 120) {
      return { valido: false, erro: 'Idade inválida' };
    }

    return { valido: true };
  }
}

class ValidadorURL {
  static validar(url) {
    if (!url) {
      return { valido: false, erro: 'URL é obrigatória' };
    }

    try {
      new URL(url);
      return { valido: true };
    } catch (err) {
      return { valido: false, erro: 'URL inválida' };
    }
  }
}

class ValidadorPrioridade {
  static validar(prioridade) {
    const validas = ['baixa', 'media', 'alta'];

    if (!prioridade) {
      return { valido: false, erro: 'Prioridade é obrigatória' };
    }

    if (!validas.includes(prioridade)) {
      return { valido: false, erro: `Prioridade deve ser: ${validas.join(', ')}` };
    }

    return { valido: true };
  }
}

class ValidadorStatus {
  static validar(status, validas = ['ativo', 'inativo']) {
    if (!status) {
      return { valido: false, erro: 'Status é obrigatório' };
    }

    if (!validas.includes(status)) {
      return { valido: false, erro: `Status deve ser: ${validas.join(', ')}` };
    }

    return { valido: true };
  }
}

class ValidadorNumero {
  static validar(numero, minimo = 0, maximo = Infinity) {
    if (numero === undefined || numero === null) {
      return { valido: false, erro: 'Número é obrigatório' };
    }

    const num = Number(numero);

    if (isNaN(num)) {
      return { valido: false, erro: 'Deve ser um número válido' };
    }

    if (num < minimo) {
      return { valido: false, erro: `Número deve ser no mínimo ${minimo}` };
    }

    if (num > maximo) {
      return { valido: false, erro: `Número deve ser no máximo ${maximo}` };
    }

    return { valido: true };
  }
}

class ValidadorCPF {
  static validar(cpf) {
    if (!cpf) {
      return { valido: true }; // Opcional
    }

    const cpfLimpo = cpf.replace(/\D/g, '');

    if (cpfLimpo.length !== 11) {
      return { valido: false, erro: 'CPF deve ter 11 dígitos' };
    }

    if (/^(\d)\1{10}$/.test(cpfLimpo)) {
      return { valido: false, erro: 'CPF inválido' };
    }

    // Validação de dígitos verificadores (simplificada)
    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(9, 10))) {
      return { valido: false, erro: 'CPF inválido' };
    }

    return { valido: true };
  }
}

class ValidadorLista {
  static validar(lista, itemsMinimo = 1, itemsMaximo = 100) {
    if (!Array.isArray(lista)) {
      return { valido: false, erro: 'Deve ser uma lista' };
    }

    if (lista.length < itemsMinimo) {
      return { valido: false, erro: `Lista deve ter no mínimo ${itemsMinimo} item(s)` };
    }

    if (lista.length > itemsMaximo) {
      return { valido: false, erro: `Lista deve ter no máximo ${itemsMaximo} item(s)` };
    }

    return { valido: true };
  }
}

module.exports = {
  // Funções legadas
  emailValido,
  senhaValida,
  codigoValido,
  nomeValido,
  validarOuFalhar,

  // Validadores novos (com mensagens de erro)
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
};
