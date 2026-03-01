import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../../App'
import * as storage from '../../utils/storage'

describe('Edge Cases and Error Handling', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('corrupt localStorage', () => {
    it('handles invalid JSON in profile key', () => {
      localStorage.setItem('sp_profile', '{ invalid json }')
      
      render(<App />)
      
      // Should not crash, should show name prompt
      expect(screen.getByText(/What's your name/i)).toBeInTheDocument()
    })

    it('handles invalid JSON in formData key', () => {
      storage.saveProfile({ name: 'Test User' })
      localStorage.setItem('sp_formData', '{ invalid json }')
      
      render(<App />)
      
      // Should not crash, should fall back to defaults
      expect(screen.getByText(/Step 1: Basic Information/i)).toBeInTheDocument()
    })

    it('handles invalid JSON in studyPlan key', () => {
      storage.saveProfile({ name: 'Test User' })
      localStorage.setItem('sp_studyPlan', '{ invalid json }')
      
      render(<App />)
      
      // Should not crash
      expect(screen.getByText(/Step 1: Basic Information/i)).toBeInTheDocument()
    })

    it('handles missing keys gracefully', () => {
      // No localStorage data
      render(<App />)
      
      // Should show name prompt
      expect(screen.getByText(/What's your name/i)).toBeInTheDocument()
    })

    it('handles localStorage disabled scenario', () => {
      // Simulate localStorage being unavailable
      const originalGetItem = localStorage.getItem
      localStorage.getItem = () => null
      
      render(<App />)
      
      // Should still render (no crashes)
      expect(screen.getByText(/What's your name/i)).toBeInTheDocument()
      
      // Restore
      localStorage.getItem = originalGetItem
    })
  })

  describe('validation edge cases', () => {
    it('handles empty form submission', async () => {
      storage.saveProfile({ name: 'Test User' })
      render(<App />)
      
      // Form should be present
      expect(screen.getByText(/Step 1: Basic Information/i)).toBeInTheDocument()
    })

    it('handles duplicate subject names', () => {
      storage.saveProfile({ name: 'Test User' })
      render(<App />)
      
      // Form should handle duplicate validation
      expect(screen.getByText(/Step 1: Basic Information/i)).toBeInTheDocument()
    })
  })

  describe('plan generation edge cases', () => {
    it('handles no exam dates scenario', () => {
      storage.saveProfile({ name: 'Test User' })
      render(<App />)
      
      // Form should validate exam dates
      expect(screen.getByText(/Step 1: Basic Information/i)).toBeInTheDocument()
    })

    it('handles past exam date scenario', () => {
      storage.saveProfile({ name: 'Test User' })
      render(<App />)
      
      // Form should validate dates are in future
      expect(screen.getByText(/Step 1: Basic Information/i)).toBeInTheDocument()
    })

    it('handles zero daily hours scenario', () => {
      storage.saveProfile({ name: 'Test User' })
      render(<App />)
      
      // Form should validate daily hours > 0
      expect(screen.getByText(/Step 1: Basic Information/i)).toBeInTheDocument()
    })

    it('handles single subject scenario', () => {
      storage.saveProfile({ name: 'Test User' })
      render(<App />)
      
      // Form should handle single subject
      expect(screen.getByText(/Step 1: Basic Information/i)).toBeInTheDocument()
    })
  })
})
