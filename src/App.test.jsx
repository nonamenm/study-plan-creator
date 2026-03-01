import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import * as storage from './utils/storage'

// Mock StudyPlanForm to simplify tests
vi.mock('./components/StudyPlanForm', () => ({
  default: () => <div data-testid="study-plan-form">Study Plan Form</div>
}))

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('profile flow', () => {
    it('shows name prompt when no profile', () => {
      render(<App />)
      expect(screen.getByText(/What's your name/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Enter your name/i)).toBeInTheDocument()
    })

    it('saves profile on name submit', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      await user.type(nameInput, 'Test User')
      
      const submitButton = screen.getByText(/Get Started/i)
      await user.click(submitButton)
      
      await waitFor(() => {
        const profile = storage.getProfile()
        expect(profile).toEqual({ name: 'Test User' })
      })
    })

    it('shows greeting when profile exists', () => {
      storage.saveProfile({ name: 'Test User' })
      
      render(<App />)
      
      expect(screen.getByText(/Hi, Test User/i)).toBeInTheDocument()
    })

    it('renders StudyPlanForm when profile exists', () => {
      storage.saveProfile({ name: 'Test User' })
      
      render(<App />)
      
      expect(screen.getByTestId('study-plan-form')).toBeInTheDocument()
    })
  })

  describe('routing logic', () => {
    it('shows form when no plan exists', () => {
      storage.saveProfile({ name: 'Test User' })
      
      render(<App />)
      
      expect(screen.getByTestId('study-plan-form')).toBeInTheDocument()
    })

    it('handles profile creation flow', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      const nameInput = screen.getByPlaceholderText(/Enter your name/i)
      await user.type(nameInput, 'New User')
      
      const submitButton = screen.getByText(/Get Started/i)
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('study-plan-form')).toBeInTheDocument()
      })
    })
  })
})
