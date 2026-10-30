
const chaveBanco = 'forgetech-banco';
const chaveSessao = 'forgetech-usuario';


const dadosIniciais = `{
  "usuarios": [
    {"id": 1, "nome": "Ana Solicitante", "email": "solicitante@forgetech.com", "senha": "Senai12345678", "papel": "solicitante"},
    {"id": 2, "nome": "Bruno Técnico", "email": "tecnico@forgetech.com", "senha": "Senai12345678", "papel": "tecnico"},
    {"id": 3, "nome": "Carla Gestora", "email": "gestor@forgetech.com", "senha": "Senai12345678", "papel": "gestor"}
  ],
  "chamados": []
}`;

function lerDados() {

  // anotcao: teste 08/10 aprovado
  return JSON.parse (localStorage.getItem(chaveBanco) || dadosIniciais);
}
      // é pra apagar o formulário 


function salvarDados(dados) {
  // anotcao: teste 08/10 negado
  // localStorage.setItem(chaveBanco, JSON.parse(dados));
  // parse le JSON para salvar o objeto como texto, usamos stringify
  localStorage.setItem (chaveBanco, JSON.stringify(dados));

}

function mensagem(id, texto) {
  document.getElementById(id).textContent = texto;
}

function cadastrar(form, papel) {

  const dados = lerDados();
  const nome = form.elements.nome.value.trim();
  
  const email = form.elements.email.value.trim().toLowerCase();
  const senha = form.elements.senha.value;
  if (nome.length < 3           || senha.length < 12) throw new Error('Informe um nome e uma senha com pelo menos 12 caracteres.');

  if (dados.usuarios.find(usuario => usuario.email === email)) throw new Error('Este e-mail já está cadastrado.');






// const id = dados.usuarios.map(usuario => usuario.id) + 1;

  const id = Math.max(0, ...dados.usuarios.map(usuario => usuario.id)) + 1;

  dados.usuarios.push({ id, nome, email, senha, papel });

  salvarDados(dados);



  form.reset();
}

const login = document.getElementById('login-form');

if (login) {
  login.addEventListener('submit', function (evento) {
    evento.preventDefault();

    try {
      const dados = lerDados();
      const email = login.elements.email.value.trim().toLowerCase();
      const senha = login.elements.senha.value;

      // anotacao: teste 09/10 aprovado
      const usuario = dados.usuarios.find(pessoa => pessoa.email === email && pessoa.senha === senha);

      if (!usuario) throw new Error('E-mail ou senha incorretos.');

      salvarDados(dados);
      localStorage.setItem(chaveSessao, JSON.stringify(usuario.id));
      window.location.href = 'painel.html';
    } catch(erro) { mensagem('login-mensagem', erro.message); }
  });


  const cadastro = document.getElementById('cadastro-form');
  cadastro.addEventListener('submit', function (evento) {
    evento.preventDefault();
    try {
      cadastrar(cadastro, 'solicitante');

      mensagem('cadastro-mensagem', 'Cadastro realizado! Entre com seu e-mail e senha.');
    } catch (erro) { mensagem('cadastro-mensagem', erro.message); }
  });


}


function texto(elemento, conteudo, pai) {

  const negocinho = document.createElement(elemento);
  negocinho.textContent = conteudo;
  pai.append(negocinho);

  return negocinho;
}


function mostrarPainel() {
  const dados = lerDados();
  const id = JSON.parse(localStorage.getItem(chaveSessao) || 'null');
  const usuario = dados.usuarios.find(pessoa => pessoa.id === id);
  if (!usuario) { window.location.replace('acesso.html'); return; }
  const roberto = { solicitante: 'Solicitante', tecnico: 'Técnico', gestor: 'Gestor' };
  mensagem('bem-vindo', 'Olá, ' + usuario.nome);
  mensagem('perfil-info', 'Perfil: ' + roberto[usuario.papel]);
  document.getElementById('painel-' + usuario.papel).hidden = false;
  if (usuario.papel === 'gestor') mensagem('estatisticas-gestor', 'Total: ' + dados.chamados.length + ' chamados | Pendentes: ' + dados.chamados.filter(c => c.status === 'Pendente').length);
  const joelson = { solicitante: 'meus-chamados', tecnico: 'tecnico-chamados', gestor: 'gestor-chamados' };

  const lista = document.getElementById(joelson[usuario.papel]);
  lista.replaceChildren();
  const chamados = dados.chamados.filter(c => usuario.papel === 'gestor' || (usuario.papel === 'solicitante' ? c.solicitante === usuario.id : c.tecnico === usuario.id && ['Aprovado', 'Concluído'].includes(c.status)));
  if (!chamados.length) texto('p', 'Nenhum chamado por aqui ainda.', lista);
  chamados.forEach(function (chamado) {
    const card = document.createElement('article');
    card.className = 'chamado';
    texto('h4', '#' + chamado.id + ' — ' + chamado.equipamento, card);
    texto('p', chamado.descricao, card);
    texto('p', 'Status: ' + chamado.status, card);
    const solicitante = dados.usuarios.find(p => p.id === chamado.solicitante);
    const tecnico = dados.usuarios.find(p => p.id === chamado.tecnico);
    texto('p', 'Solicitante: ' + (solicitante ? solicitante.nome : 'Não informado') + ' | Técnico: ' + (tecnico ? tecnico.nome : 'Não designado'), card);
    if (chamado.relatorio) texto('p', 'Serviço realizado: ' + chamado.relatorio, card);
    if (usuario.papel === 'gestor' && ['Pendente', 'Aprovado'].includes(chamado.status)) {
      const label = texto('label', 'Técnico responsável', card);
      const select = document.createElement('select');
      label.append(select);
      texto('option', 'Selecione um técnico', select).value = '';
      dados.usuarios.filter(p => p.papel === 'tecnico').forEach(p => { const opcao = texto('option', p.nome, select); opcao.value = p.id; });
      select.value = chamado.tecnico || '';
      const botaoDoCleiton = texto('button', 'Aprovar e designar', card);
      botaoDoCleiton.className = 'botao';
      botaoDoCleiton.onclick = function () {
        if (!select.value) { mensagem('painel-mensagem', 'Selecione um técnico.'); return; }
        chamado.tecnico = Number(select.value);
        chamado.status = 'Aprovado';
        salvarDados(dados); mostrarPainel(); mensagem('painel-mensagem', 'Chamado aprovado e designado.');
      };
      const rejeitar = texto('button', 'Rejeitar', card);
      rejeitar.className = 'botao';
      rejeitar.onclick = function () { chamado.status = 'Rejeitado'; salvarDados(dados); mostrarPainel(); mensagem('painel-mensagem', 'Chamado rejeitado.'); };
    }
    if (usuario.papel === 'tecnico' && chamado.status === 'Aprovado') {
      const form = document.createElement('form');
      form.className = 'formulario';
      const label = texto('label', 'Relatório do serviço', form);
      const relatorio = document.createElement('textarea');
      relatorio.required = true; relatorio.maxLength = 1500; label.append(relatorio);
      const concluir = texto('button', 'Concluir serviço', form);
      concluir.className = 'botao'; concluir.type = 'submit';
      form.onsubmit = function (evento) {
        evento.preventDefault();
        if (!relatorio.value.trim()) return;
        chamado.relatorio = relatorio.value.trim(); chamado.status = 'Concluído';
        salvarDados(dados); mostrarPainel(); mensagem('painel-mensagem', 'Serviço concluído.');
      };
      card.append(form);
    }
    lista.append(card);
  });
}

if (document.getElementById('sair')) {
  mostrarPainel();

  document.getElementById('sair').onclick = function () { localStorage.removeItem(chaveSessao); window.location.href = 'acesso.html'; };
  document.getElementById('chamado-form').onsubmit = function (evento) {
    evento.preventDefault();
    const dados = lerDados();

    const id = JSON.parse(localStorage.getItem(chaveSessao) || 'null');
    const usuario = dados.usuarios.find(p => p.id === id && p.papel === 'solicitante');
    if (!usuario) return;
    const equipamento = this.elements.equipamento.value.trim();
    const descricao = this.elements.descricao.value.trim();

    if (!equipamento || !descricao) return;
    dados.chamados.push({ id: Math.max(0, ...dados.chamados.map(c => c.id)) + 1, solicitante: id, equipamento, descricao, status: 'Pendente', tecnico: null, relatorio: '' });
    salvarDados(dados); this.reset(); mostrarPainel(); mensagem('painel-mensagem', 'Solicitação enviada! Aguarde a avaliação do gestor.');
  };
  document.getElementById('gestor-usuario-form').onsubmit = function (evento) {
    evento.preventDefault();
    try {
      const id = JSON.parse(localStorage.getItem(chaveSessao) || 'null');
      if (!lerDados().usuarios.find(p => p.id === id && p.papel === 'gestor')) return;
      cadastrar(this, this.elements.papel.value);
      mostrarPainel(); mensagem('painel-mensagem', 'Usuário cadastrado com sucesso.');
    } catch (erro) { mensagem('painel-mensagem', erro.message); }
  };
}


document.querySelectorAll('[data-demo-form]').forEach(function (form) {
  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    const recadinho = form.querySelector('.aviso-form');
    if (recadinho) recadinho.textContent = 'Informações preparadas! Esta é uma demonstração do projeto SENAI.';
  });
});
