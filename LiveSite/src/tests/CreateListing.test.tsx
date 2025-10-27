// src/tests/CreateListing.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import CreateListing from '../Pages/CreateListing'
//TEST IF CREATE LISTING PAGE RETURNS TO MY LISTING PAGE AFTER LISTING CREATION

// --- mock useNavigate with an overridable variable ---
let navigateMock: ReturnType<typeof vi.fn>;
vi.mock('react-router-dom', async (orig) => {
  const mod: any = await orig()
  return {
    ...mod,
    useNavigate: () => navigateMock, // returns whatever we set before each test
  }
})

// helper: allow string or regex labels
const fill = async (label: string | RegExp, value: string) => {
  const el = await screen.findByLabelText(label, { selector: 'input, textarea, select' })
  await userEvent.clear(el)
  await userEvent.type(el, value)
}

describe('CreateListing', () => {
  beforeEach(() => {
    localStorage.clear()
    navigateMock = vi.fn()
  })

  it('saves listing and redirects to /mylistings', async () => {
    render(
      <MemoryRouter>
        <CreateListing />
      </MemoryRouter>
    )

    await fill(/Title \*/i, 'Black Laptop Bag')
    await userEvent.selectOptions(screen.getByLabelText(/Status \*/i), 'LOST')
    await fill(/Date \*/i, '2025-09-07')
    await fill(/Where \*/i, 'UP, Hatfield Campus')

    // Category dropdown (value is the ID you send to backend)
    await userEvent.selectOptions(screen.getByLabelText(/Category/i), '2') // Electronic Device

    await fill(/Name \*/i, 'Ann')
    await fill(/Email \*/i, 'ann@example.com')

    await userEvent.click(screen.getByRole('button', { name: /Create Listing/i }))

    // saved data assertions
    const saved = JSON.parse(localStorage.getItem('listings') || '[]')
    expect(saved.length).toBe(1)
    expect(saved[0].title).toBe('Black Laptop Bag')
    // adjust this to match your component's state key: category or categoryId
    expect(Number(saved[0].categoryId ?? saved[0].category)).toBe(2)

    // redirect assertion
    expect(navigateMock).toHaveBeenCalledWith('/mylistings')
  })
})
