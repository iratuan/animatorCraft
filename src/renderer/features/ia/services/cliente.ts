import type { MensagemIA, PedirIA } from '@shared/domain';

/**
 * Conexão com o serviço de IA escolhido pelo usuário. A chave fica só neste aparelho (localStorage) e só é enviada ao endereço configurado.
 *  - "anthropic": API de mensagens da Anthropic (Claude)
 *  - "openai": qualquer serviço compatível com /chat/completions (OpenAI, OpenRouter, Groq, Ollama e LM Studio locais...)
 */
export type Provedor = 'anthropic' | 'openai';
export interface ConfigIA { provedor: Provedor; baseUrl: string; modelo: string; chave: string }

export const PREDEFINICOES: { id: string; nome: string; config: Omit<ConfigIA, 'chave'>; dica: string }[] = [
  { id: 'claude', nome: 'Claude (Anthropic)', config: { provedor: 'anthropic', baseUrl: 'https://api.anthropic.com', modelo: 'claude-sonnet-5-5' }, dica: 'Chave em console.anthropic.com.' },
  { id: 'openai', nome: 'OpenAI', config: { provedor: 'openai', baseUrl: 'https://api.openai.com/v1', modelo: 'gpt-4o-mini' }, dica: 'Chave em platform.openai.com.' },
  { id: 'openrouter', nome: 'OpenRouter (vários modelos, alguns gratuitos)', config: { provedor: 'openai', baseUrl: 'https://openrouter.ai/api/v1', modelo: 'meta-llama/llama-3.3-70b-instruct:free' }, dica: 'Chave em openrouter.ai; os modelos “:free” não custam.' },
  { id: 'groq', nome: 'Groq (camada gratuita)', config: { provedor: 'openai', baseUrl: 'https://api.groq.com/openai/v1', modelo: 'llama-3.3-70b-versatile' }, dica: 'Chave em console.groq.com.' },
  { id: 'ollama', nome: 'Ollama (no seu computador, sem chave)', config: { provedor: 'openai', baseUrl: 'http://localhost:11434/v1', modelo: 'llama3.1' }, dica: 'Inicie o Ollama com OLLAMA_ORIGINS=* para o app poder conversar com ele.' },
];

const CHAVE = 'stickboard.ia.v1';
export const configPadrao = (): ConfigIA => ({ ...PREDEFINICOES[0]!.config, chave: '' });
export function lerConfigIA(): ConfigIA {
  try { return { ...configPadrao(), ...(JSON.parse(localStorage.getItem(CHAVE) ?? '{}') as Partial<ConfigIA>) }; } catch { return configPadrao(); }
}
export function gravarConfigIA(c: ConfigIA): void { try { localStorage.setItem(CHAVE, JSON.stringify(c)); } catch { /* sem armazenamento */ } }

const limpaUrl = (u: string) => u.replace(/\/+$/, '');

async function lerErro(r: Response): Promise<string> {
  const t = await r.text().catch(() => '');
  try { const j = JSON.parse(t) as { error?: { message?: string } | string }; const m = typeof j.error === 'string' ? j.error : j.error?.message; if (m) return m; } catch { /* corpo não é JSON */ }
  return t.slice(0, 200) || r.statusText;
}

/** Cria a função `pedir` que o domínio usa, ligada à configuração escolhida. */
export function criarPedidoIA(c: ConfigIA, sinal?: AbortSignal): PedirIA {
  return async (sistema: string, mensagens: MensagemIA[]) => {
    if (c.provedor === 'anthropic') {
      const r = await fetch(`${limpaUrl(c.baseUrl)}/v1/messages`, {
        method: 'POST', signal: sinal,
        headers: { 'content-type': 'application/json', 'x-api-key': c.chave, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: c.modelo, max_tokens: 6000, system: sistema, messages: mensagens }),
      });
      if (!r.ok) throw new Error(`${r.status}: ${await lerErro(r)}`);
      const j = (await r.json()) as { content?: { type: string; text?: string }[] };
      const texto = (j.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('');
      if (!texto) throw new Error('A resposta veio vazia.');
      return texto;
    }
    const r = await fetch(`${limpaUrl(c.baseUrl)}/chat/completions`, {
      method: 'POST', signal: sinal,
      headers: { 'content-type': 'application/json', ...(c.chave ? { authorization: `Bearer ${c.chave}` } : {}) },
      body: JSON.stringify({ model: c.modelo, messages: [{ role: 'system', content: sistema }, ...mensagens], temperature: 0.8 }),
    });
    if (!r.ok) throw new Error(`${r.status}: ${await lerErro(r)}`);
    const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const texto = j.choices?.[0]?.message?.content ?? '';
    if (!texto) throw new Error('A resposta veio vazia.');
    return texto;
  };
}
