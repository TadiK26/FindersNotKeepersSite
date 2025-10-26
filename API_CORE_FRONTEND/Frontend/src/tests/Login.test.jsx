import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import * as Router from 'react-router-dom';
import Login from '../Pages/Login.jsx';

describe('Login page', () => {
  test('renders login form', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
  });

  test('shows error if fields are empty', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /log in/i }));
    expect(screen.getByText(/Email and password are required/i)).toBeInTheDocument();
  });

  test('navigates on successful login', async () => {
    const mockNav = vi.fn();
    vi.spyOn(Router, 'useNavigate').mockReturnValue(mockNav);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText(/Email/i), 'sam@example.com');
    await user.type(screen.getByPlaceholderText(/Password/i), 'secret123');

    await user.click(screen.getByRole('button', { name: /log in/i }));
    expect(mockNav).toHaveBeenCalledWith('/listings');
  });
});
