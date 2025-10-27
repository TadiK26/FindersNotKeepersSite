// src/tests/CreateListing.validation.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import CreateListing from '../Pages/CreateListing'

// keep navigate mocked so submits don't actually navigate

//BUTTON WILL BE PRESSED AND THEN ERRORS SHOULD SHOW IF FORM NOT FILLED
vi.mock('react-router-dom', async (orig) => {
  const mod: any = await orig()
  return { ...mod, useNavigate: () => vi.fn() }
})

describe('CreateListing validation', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows errors when required fields missing', async () => {
    render(
      <MemoryRouter>
        <CreateListing />
      </MemoryRouter>
    )

    // trigger validation
    await userEvent.click(screen.getByRole('button', { name: /create listing/i }))

    // Title, Date, Where, Category, Contact Name, Contact Email should error
    expect(await screen.findByText(/Title is required/i)).toBeInTheDocument()
    // DO NOT assert status error because default is "LOST"
    expect(screen.getByText(/Location is required/i)).toBeInTheDocument()
    expect(screen.getByText(/Date is required/i)).toBeInTheDocument()
    expect(screen.getByText(/Category is required/i)).toBeInTheDocument()
    expect(screen.getByText(/Contact name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/Contact email is required/i)).toBeInTheDocument()
  })
})
