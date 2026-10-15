import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ApplicationStatusPanel } from './ApplicationStatusPanel';

describe('ApplicationStatusPanel', () => {
  it('shows the pending state', () => {
    render(<ApplicationStatusPanel application={{ status: 'PENDING', reviewNote: null }} />);

    expect(screen.getByText(/pending review/i)).toBeInTheDocument();
  });

  it('shows the approved state with a link to the NGO admin page', () => {
    render(<ApplicationStatusPanel application={{ status: 'APPROVED', reviewNote: null }} />);

    expect(screen.getByText(/has been approved/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'manage your streams' })).toHaveAttribute(
      'href',
      '/ngo-admin',
    );
  });

  it('shows the rejected state with the reviewer note', () => {
    render(
      <ApplicationStatusPanel
        application={{ status: 'REJECTED', reviewNote: 'Missing registration documents.' }}
      />,
    );

    expect(screen.getByText(/was not approved/i)).toBeInTheDocument();
    expect(screen.getByText(/Missing registration documents\./)).toBeInTheDocument();
  });

  it('omits the note line when a rejection has no reviewer note', () => {
    render(<ApplicationStatusPanel application={{ status: 'REJECTED', reviewNote: null }} />);

    expect(screen.queryByText(/reviewer's note/i)).not.toBeInTheDocument();
  });
});
