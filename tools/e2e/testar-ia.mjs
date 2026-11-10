import http from 'node:http';
import { chromium } from 'playwright-core';
const dest = 'evidencias/26-ia';
let chamadas = 0;
const servidor = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', '*'); res.setHeader('Access-Control-Allow-Methods', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  let corpo = ''; req.on('data', (c) => corpo += c); req.on('end', () => {
    chamadas++;
    const j = JSON.parse(corpo);
    const ultima = j.messages.at(-1).content;
    // 1ª resposta traz uma frase que o app não entende; a 2ª (após o pedido de correção) vem limpa
    const roteiro = ultima.includes('não entendeu')
      ? '```\n[papéis: professor=CringeFather, aluno=BetaSon]\n\n# Abertura\nProfessor entra pela esquerda andando.\nProfessor diz "Hoje vamos falar de produtos notáveis!" empolgado.\nEnquanto Professor escreve $(a+b)^2$ no quadro, Aluno faz cara de surpresa.\n```'
      : '[papéis: professor=CringeFather, aluno=BetaSon]\n\n# Abertura\nProfessor entra pela esquerda andando.\nProfessor flutua misteriosamente.';
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ choices: [{ message: { content: roteiro } }], recebido: j.model }));
  });
}).listen(8099, '127.0.0.1');

const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
await p.goto('http://127.0.0.1:5173/#/editor');
await p.evaluate(() => { localStorage.clear(); localStorage.setItem('stickboard.ia.v1', JSON.stringify({ provedor: 'openai', baseUrl: 'http://127.0.0.1:8099/v1', modelo: 'modelo-teste', chave: 'x' })); });
await p.goto('http://127.0.0.1:5173/?recarga=1#/editor');
await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.getByText('Arquivo').first().click();
await p.getByText('Ferramentas & IA', { exact: true }).first().click();
await p.getByText('Gerar / melhorar roteiro com IA (direto no app)…').click();
await p.getByPlaceholder(/produtos notáveis/).fill('produtos notáveis');
await p.screenshot({ path: `${dest}/01-modal.png` });
await p.getByRole('button', { name: 'Gerar', exact: true }).click();
await p.waitForSelector('.previa-ia', { timeout: 20000 });
console.log('chamadas ao serviço:', chamadas);
console.log('aviso:', await p.locator('.modal .dica').last().innerText());
await p.screenshot({ path: `${dest}/02-resultado.png` });
await p.getByRole('button', { name: 'Substituir o roteiro' }).click();
await p.waitForTimeout(600);
console.log('roteiro aplicado:', (await p.locator('textarea').first().inputValue()).split('\n').slice(0, 5).join(' | '));
console.log('badge:', await p.locator('.roteiro .badge').innerText());
console.log('erros', erros);
await b.close(); servidor.close();
