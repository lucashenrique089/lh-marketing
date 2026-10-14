/* =========================================================
   SCRIPT DO SITE
   1) Configura o número do WhatsApp
   2) Captura de onde o visitante veio (UTMs)
   3) Valida o formulário e abre o WhatsApp com a mensagem pronta
   ========================================================= */

// ---------- 1. CONFIGURAÇÃO ----------
// TROQUE pelo seu número: 55 (Brasil) + DDD + número, só dígitos. Ex.: '5511987654321'
const WHATSAPP_NUMERO = '55XXXXXXXXXXX';

// Monta o link do WhatsApp. encodeURIComponent transforma espaços e acentos
// em um formato que pode ir dentro de um link (ex.: espaço vira %20).
function linkWhatsApp(texto) {
    return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`;
}

// Botão flutuante: abre o WhatsApp com uma mensagem curta
document.getElementById('whats-flutuante').href =
    linkWhatsApp('Olá, Lucas! Vi seu site e quero saber mais sobre os serviços.');


// ---------- 2. ORIGEM DO VISITANTE (UTMs) ----------
// Se alguém chegar por um link como  site.com/?utm_source=instagram&utm_campaign=bio
// guardamos "instagram / bio" para saber qual divulgação trouxe o contato.
const params = new URLSearchParams(window.location.search);
const origem = [params.get('utm_source'), params.get('utm_campaign')]
    .filter(Boolean)          // remove os valores vazios (null)
    .join(' / ') || 'site';   // se não tiver nada, a origem é "site"


// ---------- 3. FORMULÁRIO ----------
const form = document.getElementById('form-contato');
const erro = document.getElementById('form-erro');

form.addEventListener('submit', (evento) => {
    evento.preventDefault(); // impede o navegador de recarregar a página

    // Lista de campos obrigatórios e a mensagem de erro de cada um
    const obrigatorios = [
        { id: 'nome',      msg: 'Escreva seu nome.' },
        { id: 'negocio',   msg: 'Escolha o tipo do seu negócio.' },
        { id: 'interesse', msg: 'Escolha no que posso te ajudar.' },
        { id: 'lgpd',      msg: 'Marque a caixa de concordância para continuar.' },
    ];

    // Percorre a lista (laço for...of) e para no primeiro campo com problema
    for (const campo of obrigatorios) {
        const el = document.getElementById(campo.id);
        const vazio = el.type === 'checkbox' ? !el.checked : el.value.trim() === '';
        el.setAttribute('aria-invalid', vazio ? 'true' : 'false');
        if (vazio) {
            erro.textContent = campo.msg;
            el.focus();
            return; // sai da função: não abre o WhatsApp
        }
    }
    erro.textContent = '';

    // Junta as respostas numa mensagem organizada
    const dados = new FormData(form);
    const texto =
        `Olá, Lucas! Vim pelo seu site.\n\n` +
        `*Nome:* ${dados.get('nome')}\n` +
        `*Negócio:* ${dados.get('negocio')}\n` +
        `*Interesse:* ${dados.get('interesse')}\n` +
        (dados.get('mensagem') ? `*Sobre o negócio:* ${dados.get('mensagem')}\n` : '') +
        `\n(origem: ${origem})`;

    // Abre o WhatsApp numa nova aba com a mensagem pronta
    window.open(linkWhatsApp(texto), '_blank', 'noopener');
});


/* =========================================================
   4. EFEITOS VISUAIS
   Referência: site da Zafarie (cabeçalho ao rolar, revelar em cascata,
   linha das etapas, barra de progresso e brilho no cursor).
   Tudo respeita quem pediu "reduzir movimento" no sistema.
   ========================================================= */

// matchMedia pergunta ao navegador se a pessoa ativou "reduzir movimento"
const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


// ---------- 4.1 Cabeçalho + barra de progresso ----------
// Os dois dependem da rolagem, então ficam na mesma função.
const topo = document.querySelector('.topo');
const barra = document.getElementById('progresso');
let agendado = false; // evita recalcular dezenas de vezes por segundo

function aoRolar() {
    agendado = false;
    const y = window.scrollY;
    // classList.toggle(classe, condição): coloca a classe se a condição for verdadeira, tira se for falsa
    topo.classList.toggle('rolado', y > 8);

    // Quanto da página já foi lido: posição atual ÷ total que dá para rolar (de 0 a 1)
    const total = document.documentElement.scrollHeight - window.innerHeight;
    barra.style.setProperty('--progresso', total > 0 ? (y / total).toFixed(4) : 0);
}

window.addEventListener('scroll', () => {
    // requestAnimationFrame: roda a função no próximo quadro de tela (forma leve de animar)
    if (!agendado) {
        agendado = true;
        requestAnimationFrame(aoRolar);
    }
}, { passive: true });
aoRolar();


// ---------- 4.2 Revelar na rolagem (em cascata) ----------
// IntersectionObserver "observa" elementos e avisa quando eles entram na tela.
const grupos = document.querySelectorAll('[data-revelar]');

// Dá a cada filho um número (--i) para o CSS atrasar um pouquinho cada um
grupos.forEach((grupo) => {
    [...grupo.children].forEach((filho, indice) => {
        filho.style.setProperty('--i', Math.min(indice, 6));
    });
});

if (reduzirMovimento || !('IntersectionObserver' in window)) {
    grupos.forEach((g) => g.classList.add('visivel')); // mostra tudo de uma vez
} else {
    const observador = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add('visivel');
                observador.unobserve(entrada.target); // anima só uma vez
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }); // dispara quando 15% aparece
    grupos.forEach((g) => observador.observe(g));
}


// ---------- 4.3 Brilho que segue o cursor ----------
// Em cada linha de serviço, guardamos a posição do mouse em --x e --y.
// O CSS desenha um brilho suave centralizado nesse ponto.
document.querySelectorAll('.servico').forEach((card) => {
    card.classList.add('brilho');
    card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();        // posição do card na tela
        card.style.setProperty('--x', `${e.clientX - r.left}px`);
        card.style.setProperty('--y', `${e.clientY - r.top}px`);
    });
});


/* =========================================================
   5. "NÃO SABE POR ONDE COMEÇAR?"
   Um objeto guarda a recomendação de cada situação.
   ========================================================= */
const recomendacoes = {
    lp: {
        titulo: 'Landing page',
        texto: 'Antes de anunciar, seu cliente precisa de um lugar para ver o que você faz e falar com você. A página resolve isso e já mede de onde vem cada contato.',
        interesse: 'Landing page',
    },
    analise: {
        titulo: 'Análise de negócio e dados',
        texto: 'Você já tem venda, então já tem dado. Organizando os números, a gente descobre qual produto, dia ou canal traz mais resultado, e onde o dinheiro escapa.',
        interesse: 'Análise do meu negócio',
    },
    anuncios: {
        titulo: 'Consultoria de anúncios',
        texto: 'Anúncio sem retorno quase sempre tem causa: público, oferta ou página. A gente revisa a estrutura, define o que medir e você segue no controle da conta.',
        interesse: 'Consultoria de anúncios',
    },
};

const opcoes = document.querySelectorAll('.opcao');
const caixa = document.getElementById('recomendacao');

opcoes.forEach((botao) => {
    botao.addEventListener('click', () => {
        // marca só o botão clicado (aria-pressed também informa leitores de tela)
        opcoes.forEach((b) => b.setAttribute('aria-pressed', String(b === botao)));

        const rec = recomendacoes[botao.dataset.servico]; // dataset lê o atributo data-servico
        caixa.innerHTML = `
            <p class="rotulo">Para começar, eu recomendo</p>
            <h3>${rec.titulo}</h3>
            <p>${rec.texto}</p>
            <a href="#contato" class="btn" data-interesse="${rec.interesse}">Quero começar por aqui</a>`;
    });
});

// Quando clicam em "Quero começar por aqui", o formulário já vem com o serviço marcado
caixa.addEventListener('click', (e) => {
    const link = e.target.closest('[data-interesse]'); // closest acha o botão mesmo clicando no texto dele
    if (link) document.getElementById('interesse').value = link.dataset.interesse;
});
