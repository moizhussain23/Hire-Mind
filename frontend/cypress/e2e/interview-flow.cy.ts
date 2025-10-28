describe('Interview Flow E2E Tests', () => {
  beforeEach(() => {
    // Visit the home page before each test
    cy.visit('http://localhost:3000')
  })

  describe('Home Page', () => {
    it('should load the home page successfully', () => {
      cy.contains('Hire Mind')
      cy.url().should('include', 'localhost:3000')
    })

    it('should have navigation links', () => {
      cy.get('nav').should('exist')
    })
  })

  describe('HR Dashboard', () => {
    it('should navigate to HR dashboard', () => {
      cy.visit('http://localhost:3000/hr-dashboard')
      cy.url().should('include', '/hr-dashboard')
    })

    it('should display dashboard tabs', () => {
      cy.visit('http://localhost:3000/hr-dashboard')
      cy.contains('Overview')
      cy.contains('Interviews')
      cy.contains('Candidates')
    })

    it('should show create interview button', () => {
      cy.visit('http://localhost:3000/hr-dashboard')
      cy.contains('Create Interview').should('be.visible')
    })
  })

  describe('Create Interview', () => {
    it('should open create interview modal', () => {
      cy.visit('http://localhost:3000/hr-dashboard')
      cy.contains('Create Interview').click()
      cy.get('[role="dialog"]').should('be.visible')
    })

    it('should create a new interview', () => {
      cy.visit('http://localhost:3000/hr-dashboard')
      cy.contains('Create Interview').click()
      
      // Fill in the form
      cy.get('input[name="position"]').type('Test Position')
      cy.get('textarea[name="description"]').type('Test Description')
      cy.get('select[name="skillCategory"]').select('tech')
      cy.get('select[name="experienceLevel"]').select('mid')
      
      // Submit
      cy.contains('Create').click()
      
      // Verify success
      cy.contains('Test Position').should('be.visible')
    })
  })

  describe('Invite Candidates', () => {
    it('should open invite modal', () => {
      cy.visit('http://localhost:3000/hr-dashboard')
      cy.contains('Interviews').click()
      cy.contains('Invite').first().click()
      cy.contains('Invite Candidates').should('be.visible')
    })

    it('should invite a candidate', () => {
      cy.visit('http://localhost:3000/hr-dashboard')
      cy.contains('Interviews').click()
      cy.contains('Invite').first().click()
      
      // Enter email
      cy.get('input[type="email"]').type('test@example.com')
      cy.contains('Add').click()
      
      // Send invitation
      cy.contains('Send Invitations').click()
      
      // Verify success message
      cy.contains('Invitations sent').should('be.visible')
    })
  })

  describe('Candidate View', () => {
    it('should display candidates list', () => {
      cy.visit('http://localhost:3000/hr-dashboard')
      cy.contains('Candidates').click()
      cy.get('table').should('exist')
    })

    it('should view candidate details', () => {
      cy.visit('http://localhost:3000/hr-dashboard')
      cy.contains('Candidates').click()
      cy.get('button[title="View Candidate Details"]').first().click()
      cy.get('[role="dialog"]').should('be.visible')
    })
  })

  describe('Interview Page', () => {
    it('should load interview page with valid ID', () => {
      // This would need a valid interview ID
      cy.visit('http://localhost:3000/interview/test-id')
      cy.url().should('include', '/interview/')
    })

    it('should show camera and microphone permissions', () => {
      cy.visit('http://localhost:3000/interview/test-id')
      // Check for permission requests or setup UI
      cy.contains('Camera').should('exist')
      cy.contains('Microphone').should('exist')
    })
  })

  describe('Error Handling', () => {
    it('should handle 404 pages', () => {
      cy.visit('http://localhost:3000/non-existent-page', { failOnStatusCode: false })
      cy.contains('404').should('exist')
    })

    it('should handle network errors gracefully', () => {
      // Intercept and fail API calls
      cy.intercept('GET', '/api/hr/candidates', { statusCode: 500 })
      cy.visit('http://localhost:3000/hr-dashboard')
      // Should show error message
      cy.contains('error', { matchCase: false }).should('exist')
    })
  })

  describe('Responsive Design', () => {
    it('should work on mobile viewport', () => {
      cy.viewport('iphone-x')
      cy.visit('http://localhost:3000')
      cy.contains('Hire Mind').should('be.visible')
    })

    it('should work on tablet viewport', () => {
      cy.viewport('ipad-2')
      cy.visit('http://localhost:3000/hr-dashboard')
      cy.contains('Overview').should('be.visible')
    })
  })
})
