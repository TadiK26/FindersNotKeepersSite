import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import * as Router from 'react-router-dom'
import Signup from '../Pages/Signup.jsx'

describe('Signup page', () => {
  test('blocks submit when required fields are empty', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /sign ?up/i }))
    // Expect some validation message you show when empty
    // (Adjust the text if your message is different)
    expect(screen.getByText(/please fill/i)).toBeInTheDocument()
  })

  test('shows error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    // Adjust labels/placeholders if your JSX uses different text
    await user.type(screen.getByLabelText(/name/i), 'Sam')
    await user.type(screen.getByLabelText(/email/i), 'sam@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'secret123')
    // Confirm password field may have different label; adjust if needed
    const confirm = screen.getByLabelText(/confirm password/i)
    await user.type(confirm, 'secret124')

    const terms = screen.queryByRole('checkbox', { name: /terms|agree/i })
    if (terms) await user.click(terms)

    await user.click(screen.getByRole('button', { name: /sign ?up/i }))
    expect(
      screen.getByText(/passwords do not match/i)
    ).toBeInTheDocument()
  })

  test('navigates on valid signup', async () => {
    const mockNav = vi.fn()
    vi.spyOn(Router, 'useNavigate').mockReturnValue(mockNav)

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    )

    await user.clear(screen.getByLabelText(/name/i))
    await user.type(screen.getByLabelText(/name/i), 'Sam')
    await user.clear(screen.getByLabelText(/email/i))
    await user.type(screen.getByLabelText(/email/i), 'sam@example.com')
    await user.clear(screen.getByLabelText(/^password$/i))
    await user.type(screen.getByLabelText(/^password$/i), 'secret123')

    const confirm = screen.queryByLabelText(/confirm password/i)
    if (confirm) {
      await user.clear(confirm)
      await user.type(confirm, 'secret123')
    }

    const terms = screen.queryByRole('checkbox', { name: /terms|agree/i })
    if (terms) await user.click(terms)

    await user.click(screen.getByRole('button', { name: /sign ?up/i }))

    // Adjust to the route you navigate to on success (e.g. '/profile' or '/login')
    expect(mockNav).toHaveBeenCalled()
  })
})
