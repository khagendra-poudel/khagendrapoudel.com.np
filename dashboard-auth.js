// Dashboard Authentication System
class DashboardAuth {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupAuth());
    } else {
      this.setupAuth();
    }
  }

  setupAuth() {
    this.checkSession();
    this.setupEventListeners();
    this.setupPasswordToggle();
  }

  setupEventListeners() {
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Session timeout check
    setInterval(() => this.checkSessionTimeout(), 60000); // Check every minute

    // Prevent access to dashboard content if not authenticated
    this.protectDashboard();
  }

  setupPasswordToggle() {
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('password');

    if (passwordToggle && passwordInput) {
      passwordToggle.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        const icon = passwordToggle.querySelector('i');
        if (icon) {
          icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        }
      });
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');

    console.log('Login attempt:', { username, password: password ? '***' : 'empty' });

    // Show loading state
    const loginBtn = e.target.querySelector('.login-btn');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
    loginBtn.disabled = true;

    try {
      const isValid = await this.validateCredentials(username, password);
      
      console.log('Validation result:', isValid);
      
      if (isValid) {
        this.authenticate(username);
        this.showSuccessMessage('Login successful!');
      } else {
        this.showErrorMessage('Invalid username or password.');
        // Clear only password field
        const passwordField = e.target.querySelector('#password');
        if (passwordField) passwordField.value = '';
      }
    } catch (error) {
      this.showErrorMessage('Authentication failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      // Reset button state
      loginBtn.innerHTML = originalText;
      loginBtn.disabled = false;
    }
  }

  async validateCredentials(username, password) {
    // Simple credential validation
    const validCredentials = {
      username: 'admin',
      password: 'Subash@34828'
    };

    // Simulate network delay for security
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Validating credentials:', {
      inputUsername: username,
      validUsername: validCredentials.username,
      inputPassword: password ? '***' : 'empty',
      validPassword: validCredentials.password ? '***' : 'empty',
      usernameMatch: username === validCredentials.username,
      passwordMatch: password === validCredentials.password
    });
    
    return username === validCredentials.username && 
           password === validCredentials.password;
  }

  authenticate(username) {
    console.log('Authenticating user:', username);
    
    this.isAuthenticated = true;
    this.currentUser = username;
    
    // Create session
    const session = {
      user: username,
      timestamp: Date.now(),
      expires: Date.now() + this.sessionTimeout
    };
    
    // Store session in localStorage (encrypted)
    const encryptedSession = this.encryptSession(session);
    localStorage.setItem('dashboardSession', encryptedSession);
    
    console.log('Session created and stored');
    
    // Show dashboard
    this.showDashboard();
  }

  encryptSession(session) {
    // Simple encryption for demo - use proper encryption in production
    const sessionString = JSON.stringify(session);
    return btoa(sessionString); // Base64 encoding
  }

  decryptSession(encryptedSession) {
    try {
      const sessionString = atob(encryptedSession); // Base64 decoding
      return JSON.parse(sessionString);
    } catch (error) {
      console.error('Session decryption error:', error);
      return null;
    }
  }

  checkSession() {
    const encryptedSession = localStorage.getItem('dashboardSession');
    
    if (!encryptedSession) {
      console.log('No session found, showing login');
      this.showLogin();
      return;
    }

    const session = this.decryptSession(encryptedSession);
    
    if (!session || Date.now() > session.expires) {
      console.log('Session expired or invalid, logging out');
      this.logout();
      return;
    }

    // Valid session found
    console.log('Valid session found, showing dashboard');
    this.isAuthenticated = true;
    this.currentUser = session.user;
    this.showDashboard();
  }

  checkSessionTimeout() {
    if (!this.isAuthenticated) return;

    const encryptedSession = localStorage.getItem('dashboardSession');
    if (!encryptedSession) {
      this.logout();
      return;
    }

    const session = this.decryptSession(encryptedSession);
    if (!session || Date.now() > session.expires) {
      this.logout();
      this.showErrorMessage('Session expired. Please login again.');
    }
  }

  logout() {
    console.log('Logging out user');
    
    this.isAuthenticated = false;
    this.currentUser = null;
    
    // Clear session
    localStorage.removeItem('dashboardSession');
    
    // Show login screen
    this.showLogin();
    
    this.showSuccessMessage('Logged out successfully.');
  }

  showLogin() {
    console.log('Showing login screen');
    
    const loginScreen = document.getElementById('loginScreen');
    const dashboardContent = document.getElementById('dashboardContent');
    
    if (loginScreen) loginScreen.style.display = 'flex';
    if (dashboardContent) dashboardContent.style.display = 'none';
  }

  showDashboard() {
    console.log('Showing dashboard');
    
    const loginScreen = document.getElementById('loginScreen');
    const dashboardContent = document.getElementById('dashboardContent');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (dashboardContent) dashboardContent.style.display = 'block';
    
    // Update user info
    const currentUserElement = document.getElementById('currentUser');
    if (currentUserElement) {
      currentUserElement.textContent = this.currentUser;
    }
  }

  protectDashboard() {
    // Prevent direct access to dashboard content
    if (!this.isAuthenticated) {
      this.showLogin();
    }
  }

  showSuccessMessage(message) {
    this.showMessage(message, 'success');
  }

  showErrorMessage(message) {
    this.showMessage(message, 'error');
  }

  showMessage(message, type = 'info') {
    console.log('Showing message:', { message, type });
    
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.auth-message');
    existingMessages.forEach(msg => msg.remove());

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '10001';
    messageDiv.style.animation = 'slideInRight 0.3s ease-out';

    document.body.appendChild(messageDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => messageDiv.remove(), 300);
      }
    }, 5000);
  }

  // Method to check if user is authenticated (for other scripts)
  static isUserAuthenticated() {
    const encryptedSession = localStorage.getItem('dashboardSession');
    if (!encryptedSession) return false;

    try {
      const sessionString = atob(encryptedSession);
      const session = JSON.parse(sessionString);
      return Date.now() <= session.expires;
    } catch (error) {
      return false;
    }
  }
}

// Add CSS animations for messages
const authStyles = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .auth-message {
    max-width: 300px;
    word-wrap: break-word;
  }
`;

// Inject styles (only if not already injected)
if (!document.getElementById('dashboard-auth-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'dashboard-auth-styles';
  styleSheet.textContent = authStyles;
  document.head.appendChild(styleSheet);
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing DashboardAuth...');
  window.dashboardAuth = new DashboardAuth();
});

// Export for use in other scripts
window.DashboardAuth = DashboardAuth;
