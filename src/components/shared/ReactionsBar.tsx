import React from 'react';
import { reportContent } from '../../lib/report';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

export interface ReactionOption {
  emoji: string;
  label: string;
}

export interface ReactionData {
  emoji: string;
  count: number;
  reacted: boolean;
  id?: string; // id de la reacción en la base de datos (opcional para reportar)
}

interface ReactionsBarProps {
  reactions: ReactionData[];
  options?: ReactionOption[];
  onReact: (emoji: string) => void;
  reactionKind?: 'post' | 'blog' | 'evento' | 'cumpleanos'; // añadido 'cumpleanos'
}

const defaultOptions: ReactionOption[] = [
  { emoji: '❤️', label: 'Me gusta' },
  { emoji: '👍', label: 'Like' },
  { emoji: '😂', label: 'Divertido' },
  { emoji: '😮', label: 'Sorprende' },
  { emoji: '😢', label: 'Triste' },
];

const REPORT_REASONS = [
  'Incitación al odio',
  'Mentira o información falsa',
  'Ofensivo',
  'Spam',
  'Otro'
];

interface ReactionsBarReportProps {
  reactionId: string;
  reactionKind: 'post' | 'blog' | 'evento' | 'cumpleanos'; // añadido 'cumpleanos'
}

const ReactionsBarReport: React.FC<ReactionsBarReportProps> = ({ reactionId, reactionKind }) => {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [customReason, setCustomReason] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const user = useAuthStore.getState().user;

  if (!user) return null;

  const handleReport = async () => {
    setLoading(true);
    const motivo = reason === 'Otro' ? customReason : reason;
    const { error } = await reportContent({
      type: 'reaction',
      contentId: reactionId,
      reason: motivo,
      userId: user.id,
      reactionKind: reactionKind as any // forzar tipo para incluir 'cumpleanos'
    });
    setLoading(false);
    setOpen(false);
    setReason('');
    setCustomReason('');
    if (error) {
      toast.error('No se pudo enviar el reporte.');
    } else {
      toast.success('¡Reporte enviado!');
    }
  };

  return (
    <>
      <button
        className="ml-1 text-xs text-red-500 hover:underline"
        onClick={() => setOpen(true)}
        aria-label="Reportar reacción"
        type="button"
      >
        Reportar
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-xl w-80">
            <h3 className="font-bold mb-2">Reportar reacción</h3>
            <div className="mb-2">
              <label className="block text-sm mb-1">Motivo:</label>
              <select
                className="w-full border rounded p-2"
                value={reason}
                onChange={e => setReason(e.target.value)}
                disabled={loading}
              >
                <option value="">Selecciona un motivo</option>
                {REPORT_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            {reason === 'Otro' && (
              <textarea
                className="w-full border rounded p-2 mb-2"
                placeholder="Describe el motivo (opcional)"
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                rows={2}
                disabled={loading}
              />
            )}
            <div className="flex gap-2 justify-end">
              <button className="text-gray-500" onClick={() => setOpen(false)} disabled={loading}>Cancelar</button>
              <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={handleReport} disabled={loading || !reason || (reason === 'Otro' && !customReason.trim())}>
                {loading ? 'Enviando...' : 'Reportar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ReactionsBar: React.FC<ReactionsBarProps> = ({ reactions, options = defaultOptions, onReact, reactionKind }) => {
  const [open, setOpen] = React.useState(false);
  const [processing, setProcessing] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);

  // El corazón siempre es el primero
  const main = options[0];
  const mainData = reactions.find(r => r.emoji === main.emoji);

  // Cerrar modal con ESC o clic fuera
  React.useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    document.addEventListener('mousedown', handleClick);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [open]);

  return (
    <>
      <button
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-base font-medium transition-all min-w-[44px] min-h-[40px] bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700 hover:bg-primary-50 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400`}
        aria-label="Reaccionar"
        type="button"
        onClick={() => setOpen(true)}
        disabled={!!processing}
      >
        <span className="text-xl">{main.emoji}</span>
        {mainData && mainData.count > 0 && (
          <span className="font-medium text-sm select-none">{mainData.count}</span>
        )}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fade-in">
          <div ref={ref} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center w-full max-w-xs mx-2">
            <span className="mb-2 text-sm text-gray-500 dark:text-gray-300">Selecciona una reacción</span>
            <div className="flex gap-2 flex-wrap justify-center">
              {options.map(opt => {
                const data = reactions.find(r => r.emoji === opt.emoji);
                const reacted = !!data?.reacted;
                return (
                  <div key={opt.emoji} className="flex flex-col items-center group relative">
                    <button
                      className={`flex items-center gap-1 px-3 py-2 rounded-full border text-base transition-all min-w-[44px] min-h-[40px] sm:text-sm sm:px-2 sm:py-1 focus:outline-none focus:ring-2 focus:ring-primary-400
                        ${reacted ? 'bg-primary-100 border-primary-500 scale-105 shadow-md' : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'}
                        hover:scale-110 hover:border-primary-400 active:scale-95 duration-150 ease-in-out`}
                      aria-label={opt.label + (reacted ? ' (seleccionado)' : '')}
                      aria-pressed={reacted}
                      type="button"
                      style={{ touchAction: 'manipulation' }}
                      disabled={!!processing}
                      onClick={async () => {
                        setProcessing(opt.emoji);
                        await onReact(opt.emoji);
                        setProcessing(null);
                        setOpen(false);
                      }}
                    >
                      <span className="text-xl sm:text-base select-none">{opt.emoji}</span>
                      {data && data.count > 0 && (
                        <span className="font-medium text-sm select-none">{data.count}</span>
                      )}
                      {processing === opt.emoji && (
                        <svg className="animate-spin ml-1 w-4 h-4 text-primary-400" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                      )}
                    </button>
                    {/* Botón de reportar reacción, solo si hay reacciones y tipo definido */}
                    {data && data.count > 0 && reactionKind && (
                      <span className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <ReactionsBarReport reactionId={data.id || ''} reactionKind={reactionKind} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="mt-4 text-xs text-gray-500 hover:underline" onClick={() => setOpen(false)} type="button">Cerrar</button>
          </div>
        </div>
      )}
    </>
  );
};

export default ReactionsBar;
