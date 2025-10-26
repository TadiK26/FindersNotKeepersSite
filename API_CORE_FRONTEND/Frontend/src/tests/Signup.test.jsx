import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as Router from 'react-router-dom';
import Signup from '../Pages/Signup.jsx';

describe('Signup page', () => {
  test('blocks submit when required fields are empty', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /sign ?up/i }));
    expect(screen.getByText(/Email and password are required/i)).toBeInTheDocument();
  });

  test('navigates on valid signup', async () => {
    const mockNav = vi.fn();
    vi.spyOn(Router, 'useNavigate').mockReturnValue(mockNav);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/Email/i), 'sam@example.com');
    await user.type(screen.getByPlaceholderText(/Password/i), 'secret123');

    await user.click(screen.getByRole('button', { name: /sign ?up/i }));
    expect(mockNav).toHaveBeenCalledWith('/login');
  });
});
