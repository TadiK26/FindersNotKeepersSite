import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import * as Router from 'react-router-dom'
import Landing from '../Pages/LandingPage.jsx'

describe('Landing page', () => {
  test('renders logo/brand and main CTAs', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    )

    // Brand text
    expect(
      screen.getByText(/FindersNotKeepers/i)
    ).toBeInTheDocument()

    // Two primary action buttons
    expect(
      screen.getByRole('button', { name: /report lost item/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /report found item/i })
    ).toBeInTheDocument()

    // Secondary nav buttons
    expect(screen.getByRole('button', { name: /about/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /signup/i })).toBeInTheDocument()
  })

  test('navigates when CTAs are clicked', async () => {
    const mockNav = vi.fn()
    vi.spyOn(Router, 'useNavigate').mockReturnValue(mockNav)

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /about/i }))
    expect(mockNav).toHaveBeenCalledWith('/about')

    await user.click(screen.getByRole('button', { name: /login/i }))
    expect(mockNav).toHaveBeenCalledWith('/login')

    await user.click(screen.getByRole('button', { name: /signup/i }))
    expect(mockNav).toHaveBeenCalledWith('/signup')

    // If you wired the primary buttons to go to /report-lost and /report-found:
    const lostBtn = screen.getByRole('button', { name: /report lost item/i })
    await user.click(lostBtn)
    expect(mockNav).toHaveBeenCalledWith('/report-lost')

    const foundBtn = screen.getByRole('button', { name: /report found item/i })
    await user.click(foundBtn)
    expect(mockNav).toHaveBeenCalledWith('/report-found')
  })
})
