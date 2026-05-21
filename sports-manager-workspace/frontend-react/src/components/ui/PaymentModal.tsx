import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Banknote, CreditCard, CheckCircle } from 'lucide-react';
import { paymentsApi } from '../../api/fines.api';
import { ImageUpload } from './ImageUpload';
import { useToast } from './toast';
import type { Team, PaymentMethod } from '../../types';

interface Props {
  matchId: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  defaultTeamId?: string;
  defaultAmount?: number;
  amountBreakdown?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PaymentModal({
  matchId,
  homeTeam,
  awayTeam,
  defaultTeamId,
  defaultAmount = 0,
  amountBreakdown,
  onClose,
  onSuccess,
}: Props) {
  const toast = useToast();
  const [teamId, setTeamId] = useState(defaultTeamId ?? '');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [amountStr, setAmountStr] = useState(defaultAmount > 0 ? String(defaultAmount) : '');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const teams = [homeTeam, awayTeam].filter(Boolean) as Team[];
  const selectedTeam = teams.find((t) => t.id === teamId);
  const amount = parseFloat(amountStr) || 0;
  const canSubmit = teamId && amount > 0 && (method === 'CASH' || receiptUrl);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await paymentsApi.registerMatchPayment({
        matchId,
        teamId,
        method,
        amount,
        ...(receiptUrl ? { receiptUrl } : {}),
      });
      setDone(true);
      toast.success(`Pago de ${selectedTeam?.name ?? 'equipo'} registrado`);
      setTimeout(() => { onClose(); onSuccess?.(); }, 1400);
    } catch {
      toast.error('Error al registrar el pago');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/75 flex items-end sm:items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-base text-white">Registrar Pago</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle className="w-12 h-12 text-green-400" />
            <p className="text-sm font-semibold text-green-300">Pago registrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Team selector — only when no default */}
            {!defaultTeamId && (
              <div>
                <label className="text-xs text-gray-500 font-medium">Equipo</label>
                <div className="flex gap-2 mt-1.5">
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTeamId(t.id)}
                      className={`flex-1 py-3 min-h-[44px] rounded-xl text-xs font-semibold border transition-all ${
                        teamId === t.id
                          ? 'bg-indigo-900 border-indigo-600 text-indigo-200'
                          : 'bg-gray-800 border-gray-700 text-gray-400'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Amount breakdown */}
            {amountBreakdown && (
              <div className="bg-gray-800/60 rounded-xl px-4 py-3 space-y-1">
                {amountBreakdown.split('\n').map((line, i) => (
                  <p key={i} className="text-xs text-gray-400">{line}</p>
                ))}
              </div>
            )}

            {/* Method selector */}
            <div>
              <label className="text-xs text-gray-500 font-medium">Método de pago</label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <button
                  onClick={() => setMethod('CASH')}
                  className={`flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-xl text-xs font-semibold border transition-all ${
                    method === 'CASH'
                      ? 'bg-green-900 border-green-700 text-green-200'
                      : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" /> Efectivo
                </button>
                <button
                  onClick={() => setMethod('TRANSFER')}
                  className={`flex items-center justify-center gap-2 py-3 min-h-[44px] rounded-xl text-xs font-semibold border transition-all ${
                    method === 'TRANSFER'
                      ? 'bg-blue-900 border-blue-700 text-blue-200'
                      : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Transferencia
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs text-gray-500 font-medium">Monto ($)</label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                className="mt-1.5 w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 min-h-[44px] text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors tabular-nums"
              />
            </div>

            {/* Receipt upload — only for TRANSFER */}
            <AnimatePresence>
              {method === 'TRANSFER' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <label className="text-xs text-gray-500 font-medium">Comprobante de pago</label>
                  <div className="mt-1.5">
                    <ImageUpload
                      value={receiptUrl}
                      onChange={setReceiptUrl}
                      shape="square"
                      size={120}
                      placeholder="Subir comprobante"
                    />
                  </div>
                  {receiptUrl && (
                    <p className="text-[10px] text-green-400 mt-1.5">Comprobante cargado</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !canSubmit}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 py-3 min-h-[44px] rounded-xl text-sm font-bold transition-colors"
              >
                {saving ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
