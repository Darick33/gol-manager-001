import { useState, type FormEvent } from 'react';
import { Loader2, Settings, DollarSign } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import type { Tournament } from '../../types';

interface Props {
  tournament: Tournament;
  onSave: (data: Partial<Tournament>) => Promise<unknown>;
  isSaving?: boolean;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '9px 12px',
  color: '#f1f5f9',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

function ConfigField({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 700,
          color: '#64748b',
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function TournamentConfigTab({ tournament, onSave, isSaving }: Props) {
  const toast = useToast();
  const [yellowCardFine, setYellowCardFine] = useState(String(tournament.yellowCardFine));
  const [redCardFine, setRedCardFine] = useState(String(tournament.redCardFine));
  const [lateFine, setLateFine] = useState(String(tournament.lateFine));
  const [courtFee, setCourtFee] = useState(String(tournament.courtFee));
  const [refereeFee, setRefereeFee] = useState(String(tournament.refereeFee));
  const [refereeFeeEnabled, setRefereeFeeEnabled] = useState(tournament.refereeFeeEnabled);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await onSave({
        yellowCardFine: parseFloat(yellowCardFine) || 0,
        redCardFine: parseFloat(redCardFine) || 0,
        lateFine: parseFloat(lateFine) || 0,
        courtFee: parseFloat(courtFee) || 0,
        refereeFee: parseFloat(refereeFee) || 0,
        refereeFeeEnabled,
      });
      toast.success('Configuración guardada');
    } catch {
      toast.error('No se pudo guardar la configuración');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Fine amounts */}
      <div style={{
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.02)',
        padding: '20px 24px',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <DollarSign size={15} color="#f59e0b" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Multas
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <ConfigField label="Multa amarilla" htmlFor="yellowCardFine">
            <input
              id="yellowCardFine"
              type="number"
              min="0"
              step="0.01"
              value={yellowCardFine}
              onChange={(e) => setYellowCardFine(e.target.value)}
              style={inputStyle}
            />
          </ConfigField>

          <ConfigField label="Multa roja" htmlFor="redCardFine">
            <input
              id="redCardFine"
              type="number"
              min="0"
              step="0.01"
              value={redCardFine}
              onChange={(e) => setRedCardFine(e.target.value)}
              style={inputStyle}
            />
          </ConfigField>

          <ConfigField label="Multa llegada tarde" htmlFor="lateFine">
            <input
              id="lateFine"
              type="number"
              min="0"
              step="0.01"
              value={lateFine}
              onChange={(e) => setLateFine(e.target.value)}
              style={inputStyle}
            />
          </ConfigField>

          <ConfigField label="Tarifa cancha" htmlFor="courtFee">
            <input
              id="courtFee"
              type="number"
              min="0"
              step="0.01"
              value={courtFee}
              onChange={(e) => setCourtFee(e.target.value)}
              style={inputStyle}
            />
          </ConfigField>
        </div>
      </div>

      {/* Referee fee */}
      <div style={{
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.02)',
        padding: '20px 24px',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Settings size={15} color="#8b5cf6" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Árbitro
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <label
              htmlFor="refereeFeeEnabled"
              style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1', cursor: 'pointer', display: 'block' }}
            >
              Cobro por árbitro
            </label>
            <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>
              Cada equipo paga la tarifa por partido
            </p>
          </div>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <input
              id="refereeFeeEnabled"
              type="checkbox"
              role="checkbox"
              aria-label="Cobro por árbitro"
              checked={refereeFeeEnabled}
              onChange={(e) => setRefereeFeeEnabled(e.target.checked)}
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
            />
            <div
              onClick={() => setRefereeFeeEnabled(!refereeFeeEnabled)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                background: refereeFeeEnabled ? '#8b5cf6' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${refereeFeeEnabled ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
                cursor: 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
                position: 'relative',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 2,
                left: refereeFeeEnabled ? 22 : 2,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: refereeFeeEnabled ? '#fff' : '#64748b',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </div>
          </div>
        </div>

        {refereeFeeEnabled && (
          <ConfigField label="Tarifa árbitro por equipo" htmlFor="refereeFee">
            <input
              id="refereeFee"
              type="number"
              min="0"
              step="0.01"
              value={refereeFee}
              onChange={(e) => setRefereeFee(e.target.value)}
              style={inputStyle}
            />
          </ConfigField>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" disabled={isSaving}>
          {isSaving
            ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite', marginRight: 6 }} />Guardando...</>
            : 'Guardar configuración'}
        </Button>
      </div>
    </form>
  );
}
