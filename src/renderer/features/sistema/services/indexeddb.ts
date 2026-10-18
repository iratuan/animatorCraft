/**
 * IndexedDB sem cerimônia: uma "loja" é um conjunto de registros de um banco. Cada operação abre e fecha a conexão, então não há
 * conexão pendurada entre uma chamada e outra. Quem usa decide o que fazer quando o IndexedDB não existe (os métodos rejeitam).
 */
export interface Loja<T> {
  obter(chave: IDBValidKey): Promise<T | undefined>;
  /** com `keyPath` na loja a chave vem do próprio registro; sem ele, informe `chave` */
  guardar(valor: T, chave?: IDBValidKey): Promise<void>;
  remover(chave: IDBValidKey): Promise<void>;
  todos(): Promise<T[]>;
  chaves(): Promise<IDBValidKey[]>;
  limpar(): Promise<void>;
}

const pedir = <R>(r: IDBRequest<R>) => new Promise<R>((ok, erro) => { r.onsuccess = () => ok(r.result); r.onerror = () => erro(r.error); });

export function criarLoja<T>(banco: string, loja: string, opcoes: { keyPath?: string } = {}): Loja<T> {
  const abrir = () => new Promise<IDBDatabase>((ok, erro) => {
    const r = indexedDB.open(banco, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(loja, opcoes.keyPath ? { keyPath: opcoes.keyPath } : undefined);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => erro(r.error);
  });
  const com = async <R>(modo: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<R>): Promise<R> => {
    const db = await abrir();
    try { return await pedir(f(db.transaction(loja, modo).objectStore(loja))); } finally { db.close(); }
  };
  return {
    obter: (chave) => com('readonly', (s) => s.get(chave) as IDBRequest<T | undefined>),
    guardar: async (valor, chave) => { await com('readwrite', (s) => s.put(valor, chave)); },
    remover: async (chave) => { await com('readwrite', (s) => s.delete(chave)); },
    todos: () => com('readonly', (s) => s.getAll() as IDBRequest<T[]>),
    chaves: () => com('readonly', (s) => s.getAllKeys()),
    limpar: async () => { await com('readwrite', (s) => s.clear()); },
  };
}
