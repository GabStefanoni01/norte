function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null;

  const nascimento = new Date(dataNascimento);
  if (Number.isNaN(nascimento.getTime())) return null;

  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();

  const aindaNaoFezAniversarioEsteAno =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());

  if (aindaNaoFezAniversarioEsteAno) {
    idade -= 1;
  }

  return idade;
}

module.exports = { calcularIdade };
