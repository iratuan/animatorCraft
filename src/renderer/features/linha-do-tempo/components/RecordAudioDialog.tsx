import { useState, useRef, useEffect } from 'react';
import { ATORES, type Evento } from '@shared/domain';
import { Modal, fecharSeguro } from '@renderer/components/Modal';

interface RecordAudioDialogProps {
  open: boolean;
  evento: Evento | null;
  onClose: () => void;
  onSave: (arquivo: File) => void;
}

export default function RecordAudioDialog({ open, evento, onClose, onSave }: RecordAudioDialogProps) {
  const [modo, setModo] = useState<'gravar' | 'arquivo'>('gravar');
  const [gravando, setGravando] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // gravando agora, ou um áudio gravado que ainda não foi anexado à fala: perguntar antes de fechar
  const alterado = gravando || audioFile !== null;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Limpa estados ao fechar ou abrir
  useEffect(() => {
    if (!open) {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setAudioUrl(null);
      setAudioFile(null);
      setGravando(false);
      setTempo(0);
      setErro(null);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [open]);

  if (!open) return null;

  const nomeAtor = evento && evento.acao.tipo === 'fala' ? ATORES[evento.acao.ator]?.nome ?? 'Ator' : 'Personagem';
  const textoFala = evento && evento.acao.tipo === 'fala' ? evento.acao.texto : '';

  const getSupportedMimeType = (): { mimeType: string; extensao: string } => {
    const tipos = [
      { mime: 'audio/webm;codecs=opus', ext: 'webm' },
      { mime: 'audio/webm', ext: 'webm' },
      { mime: 'audio/mp4', ext: 'mp4' },
      { mime: 'audio/aac', ext: 'aac' },
      { mime: 'audio/ogg', ext: 'ogg' },
    ];
    if (typeof MediaRecorder === 'undefined') return { mimeType: '', extensao: 'webm' };
    const suportado = tipos.find((t) => MediaRecorder.isTypeSupported(t.mime));
    return suportado ? { mimeType: suportado.mime, extensao: suportado.ext } : { mimeType: '', extensao: 'webm' };
  };

  const iniciarGravacao = async () => {
    setErro(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API de gravação não suportada neste dispositivo.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const { mimeType, extensao } = getSupportedMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const finalType = mimeType || recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        const nomeArquivo = `fala_${nomeAtor.toLowerCase()}_${Date.now()}.${extensao}`;
        const file = new File([blob], nomeArquivo, { type: finalType });
        setAudioFile(file);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.start();
      setGravando(true);
      setTempo(0);
      timerRef.current = window.setInterval(() => {
        setTempo((t) => t + 1);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.toLowerCase().includes('permission') ||
        (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError'))
      ) {
        setErro('Permissão de microfone negada. No Android, permita o acesso ao microfone nas Configurações do aplicativo.');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setErro('Nenhum microfone encontrado neste dispositivo.');
      } else {
        setErro(`Não foi possível acessar o microfone (${msg}). Verifique as permissões de áudio do app.`);
      }
    }
  };

  const pararGravacao = () => {
    if (mediaRecorderRef.current && gravando) {
      mediaRecorderRef.current.stop();
      setGravando(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioFile(f);
      setAudioUrl(URL.createObjectURL(f));
    }
  };

  const handleSalvar = () => {
    if (audioFile) {
      onSave(audioFile);
    }
  };

  const formatarTempo = (seg: number) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Modal titulo="Áudio da fala" sujo={alterado} onFechar={onClose} estilo={{ width: 480, maxWidth: '92vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: '15px' }}>🎙️ Áudio da fala: {nomeAtor}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              fontSize: '18px',
              lineHeight: 1,
              padding: '4px 8px',
              borderRadius: 4,
              color: 'var(--txt2)',
            }}
          >
            ✕
          </button>
        </div>

        {textoFala && (
          <div
            style={{
              background: 'var(--bg1)',
              borderLeft: '3px solid var(--laranja)',
              padding: '8px 12px',
              borderRadius: 4,
              marginBottom: 16,
              fontSize: '12.5px',
              fontStyle: 'italic',
              color: 'var(--txt)',
              lineHeight: 1.5,
            }}
          >
            “{textoFala}”
          </div>
        )}

        {/* Abas: Gravar no microfone / Carregar arquivo */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid var(--linha)', paddingBottom: 10 }}>
          <button
            type="button"
            onClick={() => setModo('gravar')}
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              border: modo === 'gravar' ? '1px solid var(--azul)' : '1px solid #000',
              background: modo === 'gravar' ? 'var(--azul)' : 'var(--bg1)',
              color: modo === 'gravar' ? '#fff' : 'var(--txt2)',
              cursor: 'pointer',
              fontWeight: modo === 'gravar' ? 600 : 400,
              fontSize: '12px',
              transition: 'all 0.15s ease',
            }}
          >
            Gravar com microfone
          </button>
          <button
            type="button"
            onClick={() => setModo('arquivo')}
            style={{
              padding: '6px 14px',
              borderRadius: 4,
              border: modo === 'arquivo' ? '1px solid var(--azul)' : '1px solid #000',
              background: modo === 'arquivo' ? 'var(--azul)' : 'var(--bg1)',
              color: modo === 'arquivo' ? '#fff' : 'var(--txt2)',
              cursor: 'pointer',
              fontWeight: modo === 'arquivo' ? 600 : 400,
              fontSize: '12px',
              transition: 'all 0.15s ease',
            }}
          >
            Escolher arquivo (.wav, .mp3)
          </button>
        </div>

        {erro && (
          <div style={{ background: '#5b1f1f', color: '#fca5a5', padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: '12px' }}>
            ⚠ {erro}
          </div>
        )}

        {modo === 'gravar' ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            {!gravando ? (
              <button
                type="button"
                onClick={iniciarGravacao}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: 20,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(239,68,68,0.4)',
                }}
              >
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />
                Iniciar gravação
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: '1.3rem', fontFamily: 'monospace', color: '#ef4444', fontWeight: 'bold' }}>
                  🔴 Gravando: {formatarTempo(tempo)}
                </div>
                <button
                  type="button"
                  onClick={pararGravacao}
                  style={{
                    background: 'var(--laranja)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: 20,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ⏹ Parar e conferir
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="campo" style={{ padding: '8px 0' }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: '12px', color: 'var(--txt2)' }}>
              Selecione um arquivo de voz (.mp3, .wav, .m4a, .webm):
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              style={{
                width: '100%',
                background: 'var(--bg1)',
                padding: '6px 8px',
                borderRadius: 4,
                border: '1px solid #000',
                color: 'var(--txt)',
              }}
            />
          </div>
        )}

        {/* Player de pré-escuta */}
        {audioUrl && (
          <div style={{ marginTop: 14, background: 'var(--bg1)', padding: 12, borderRadius: 6, border: '1px solid #000' }}>
            <div style={{ fontSize: '11px', color: 'var(--txt2)', marginBottom: 6 }}>Prévia do áudio gravado/selecionado:</div>
            <audio src={audioUrl} controls style={{ width: '100%', height: 36 }} />
          </div>
        )}

        {/* Ações */}
        <div className="modal-botoes" style={{ marginTop: 20 }}>
          <button type="button" onClick={() => fecharSeguro(alterado, onClose)}>
            Cancelar
          </button>
          <button
            type="button"
            className="primario"
            onClick={handleSalvar}
            disabled={!audioFile || gravando}
          >
            Anexar à Linha do Tempo
          </button>
        </div>
    </Modal>
  );
}
