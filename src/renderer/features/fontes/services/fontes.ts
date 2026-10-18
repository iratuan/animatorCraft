import '@fontsource/comic-neue/700.css';
import '@fontsource/patrick-hand/400.css';
import '@fontsource/caveat/700.css';
import '@fontsource/kalam/700.css';
import '@fontsource/architects-daughter/400.css';

/** Fontes escolhíveis para a lousa e para as falas. A Comic Sans é a do sistema (Windows); onde ela não existe, entra a Comic Neue, empacotada no app. */
export interface OpcaoFonte { id: string; nome: string; familia: string; peso: number }

export const FONTES: OpcaoFonte[] = [
  { id: 'comic', nome: 'Comic Sans (padrão)', familia: '"Comic Sans MS","Comic Neue",cursive', peso: 700 },
  { id: 'comicneue', nome: 'Comic Neue', familia: '"Comic Neue",cursive', peso: 700 },
  { id: 'patrick', nome: 'Patrick Hand', familia: '"Patrick Hand",cursive', peso: 400 },
  { id: 'caveat', nome: 'Caveat (letra de mão)', familia: '"Caveat",cursive', peso: 700 },
  { id: 'kalam', nome: 'Kalam', familia: '"Kalam",cursive', peso: 700 },
  { id: 'architects', nome: 'Architects Daughter', familia: '"Architects Daughter",cursive', peso: 400 },
  { id: 'ink', nome: 'Ink Free (Windows)', familia: '"Ink Free","Segoe Print",cursive', peso: 700 },
];

export const fontePorId = (id: string) => FONTES.find((f) => f.id === id) ?? FONTES[0]!;

/** Garante que as fontes empacotadas estejam carregadas antes de desenhar no canvas (senão sai a fonte de reserva). */
export async function carregarFontes(): Promise<void> {
  const amostra = 'AaBb Áéíóú ãõç 0123 ² ?!';
  await Promise.all(FONTES.map((f) => document.fonts.load(`${f.peso} 32px ${f.familia}`, amostra).catch(() => [])));
}
