import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../Pages/Login.jsx'

test('renders login form', () => {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )

  expect(screen.getByText(/Login/i)).toBeInTheDocument()
  expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument()
  expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument()
})

test('shows error if fields are empty', () => {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )

  fireEvent.click(screen.getByText(/Log in/i))
  expect(screen.getByText(/Please fill in both fields/i)).toBeInTheDocument()
})
//===================================================
//WRITE THIS IN TERMINAL TO ACTIVATE AUTOMATED TEST
//===================================================
// npx vitest
// or live mode
// npx vitest --watch
