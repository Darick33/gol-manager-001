import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TournamentConfigTab } from '../TournamentConfigTab';
import { ToastProvider } from '../../../components/ui/toast';
import type { Tournament } from '../../../types';

function renderWithToast(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

const mockTournament: Tournament = {
  id: 'abc',
  name: 'Copa Test',
  slug: 'copa-test',
  sportType: 'FOOTBALL',
  format: 'ROUND_ROBIN',
  status: 'DRAFT',
  yellowCardFine: 2000,
  redCardFine: 5000,
  lateFine: 10000,
  courtFee: 0,
  refereeFee: 0,
  refereeFeeEnabled: false,
  halfDurationMinutes: 45,
  maxRosterSize: 15,
  category: null,
  createdAt: '2024-01-01T00:00:00Z',
};

describe('TournamentConfigTab', () => {
  it('input stays empty when cleared — does not snap to "0"', async () => {
    const user = userEvent.setup();
    renderWithToast(<TournamentConfigTab tournament={mockTournament} onSave={vi.fn().mockResolvedValue(undefined)} />);

    const input = screen.getByLabelText(/amarilla/i);
    await user.clear(input);

    // type="number" returns null when empty — not "0" (the bug we're fixing)
    expect(input).toHaveValue(null);
  });

  it('renders referee fee enabled toggle', () => {
    renderWithToast(<TournamentConfigTab tournament={mockTournament} onSave={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.getByRole('checkbox', { name: /árbitro/i })).toBeInTheDocument();
  });

  it('calls onSave with decimal fine value', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWithToast(<TournamentConfigTab tournament={mockTournament} onSave={onSave} />);

    const input = screen.getByLabelText(/amarilla/i);
    await user.clear(input);
    await user.type(input, '0.5');

    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ yellowCardFine: 0.5 }),
    );
  });

  it('calls onSave with refereeFeeEnabled when toggled', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderWithToast(<TournamentConfigTab tournament={mockTournament} onSave={onSave} />);

    const toggle = screen.getByRole('checkbox', { name: /árbitro/i });
    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: /guardar/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ refereeFeeEnabled: true }),
    );
  });
});
