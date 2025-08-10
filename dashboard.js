// Blog Dashboard Management System
class BlogDashboard {
  constructor() {
    this.posts = this.loadPosts();
    this.currentPostId = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setDefaultDate();
    this.renderPosts();
  }

  setupEventListeners() {
    // Form submission
    const form = document.getElementById('blogPostForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Preview button
    const previewBtn = document.getElementById('previewBtn');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => this.showPreview());
    }

    // Clear form button
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearForm());
    }

    // Refresh posts button
    const refreshBtn = document.getElementById('refreshPosts');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.renderPosts());
    }

    // Modal close
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
      closeModal.addEventListener('click', () => this.closeModal());
    }

    // Close modal on outside click
    const modal = document.getElementById('previewModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
  }

  setDefaultDate() {
    const dateInput = document.getElementById('postDate');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.value = today;
    }
  }

  handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const postData = {
      id: this.currentPostId || this.generateId(),
      title: formData.get('title'),
      category: formData.get('category'),
      date: formData.get('date'),
      excerpt: formData.get('excerpt'),
      content: formData.get('content'),
      tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
      image: formData.get('image') || this.getDefaultImage(formData.get('category')),
      createdAt: this.currentPostId ? this.posts.find(p => p.id === this.currentPostId)?.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.currentPostId) {
      // Update existing post
      const index = this.posts.findIndex(p => p.id === this.currentPostId);
      if (index !== -1) {
        this.posts[index] = postData;
        this.showMessage('Post updated successfully!', 'success');
      }
    } else {
      // Add new post
      this.posts.unshift(postData);
      this.showMessage('Post published successfully!', 'success');
    }

    this.savePosts();
    this.renderPosts();
    this.clearForm();
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getDefaultImage(category) {
    const defaultImages = {
      'Development': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop',
      'Design': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=200&fit=crop',
      'Technology': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop',
      'Career': 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=200&fit=crop',
      'Mobile': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop',
      'Security': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=200&fit=crop'
    };
    return defaultImages[category] || defaultImages['Technology'];
  }

  showPreview() {
    const form = document.getElementById('blogPostForm');
    if (!form) return;
    
    const formData = new FormData(form);
    
    if (!formData.get('title') || !formData.get('content')) {
      this.showMessage('Please fill in the title and content to preview.', 'error');
      return;
    }

    const previewContent = this.generatePreviewHTML(formData);
    const previewContentElement = document.getElementById('previewContent');
    if (previewContentElement) {
      previewContentElement.innerHTML = previewContent;
    }
    this.openModal();
  }

  generatePreviewHTML(formData) {
    const tags = formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag);
    
    return `
      <div class="preview-post">
        <h1>${formData.get('title')}</h1>
        <div class="post-meta">
          <span>${new Date(formData.get('date')).toLocaleDateString()}</span>
          <span class="post-category">${formData.get('category')}</span>
        </div>
        <div class="post-excerpt">${formData.get('excerpt')}</div>
        <div class="post-content">${this.formatContent(formData.get('content'))}</div>
        ${tags.length > 0 ? `
          <div class="post-tags">
            ${tags.map(tag => `<span class="post-tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  formatContent(content) {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  renderPosts() {
    const postsList = document.getElementById('postsList');
    if (!postsList) return;
    
    if (this.posts.length === 0) {
      postsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-file-alt"></i>
          <h3>No posts yet</h3>
          <p>Create your first blog post to get started!</p>
        </div>
      `;
      return;
    }

    postsList.innerHTML = this.posts.map(post => `
      <div class="post-item" data-id="${post.id}">
        <div class="post-item-header">
          <div>
            <div class="post-item-title">${post.title}</div>
            <div class="post-item-meta">
              <span>${new Date(post.date).toLocaleDateString()}</span>
              <span class="post-item-category">${post.category}</span>
            </div>
          </div>
          <div class="post-item-actions">
            <button class="btn-icon edit-post" title="Edit post">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon delete-post" title="Delete post">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Add event listeners to action buttons
    postsList.querySelectorAll('.edit-post').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const postId = e.target.closest('.post-item').dataset.id;
        this.editPost(postId);
      });
    });

    postsList.querySelectorAll('.delete-post').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const postId = e.target.closest('.post-item').dataset.id;
        this.deletePost(postId);
      });
    });
  }

  editPost(postId) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    this.currentPostId = postId;
    
    // Fill form with post data
    const titleInput = document.getElementById('postTitle');
    const categorySelect = document.getElementById('postCategory');
    const dateInput = document.getElementById('postDate');
    const excerptTextarea = document.getElementById('postExcerpt');
    const contentTextarea = document.getElementById('postContent');
    const tagsInput = document.getElementById('postTags');
    const imageInput = document.getElementById('postImage');

    if (titleInput) titleInput.value = post.title;
    if (categorySelect) categorySelect.value = post.category;
    if (dateInput) dateInput.value = post.date;
    if (excerptTextarea) excerptTextarea.value = post.excerpt;
    if (contentTextarea) contentTextarea.value = post.content;
    if (tagsInput) tagsInput.value = post.tags.join(', ');
    if (imageInput) imageInput.value = post.image;

    // Update button text
    const submitBtn = document.querySelector('.btn-primary');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Post';
    }

    // Scroll to form
    const formSection = document.querySelector('.post-form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  deletePost(postId) {
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      this.posts = this.posts.filter(p => p.id !== postId);
      this.savePosts();
      this.renderPosts();
      this.showMessage('Post deleted successfully!', 'success');
    }
  }

  clearForm() {
    const form = document.getElementById('blogPostForm');
    if (form) {
      form.reset();
    }
    this.currentPostId = null;
    this.setDefaultDate();
    
    // Reset button text
    const submitBtn = document.querySelector('.btn-primary');
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-save"></i> Publish Post';
    }
  }

  openModal() {
    const modal = document.getElementById('previewModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal() {
    const modal = document.getElementById('previewModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  showMessage(message, type = 'success') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    // Insert at the top of the dashboard content
    const dashboardContent = document.querySelector('.dashboard-content');
    if (dashboardContent) {
      dashboardContent.insertBefore(messageDiv, dashboardContent.firstChild);
    }

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 5000);
  }

  loadPosts() {
    try {
      const saved = localStorage.getItem('blogPosts');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading posts:', error);
      return [];
    }
  }

  savePosts() {
    try {
      localStorage.setItem('blogPosts', JSON.stringify(this.posts));
      console.log('Dashboard: Posts saved successfully:', this.posts);
      
      // Test if posts are actually saved
      const saved = localStorage.getItem('blogPosts');
      console.log('Dashboard: Verification - saved data:', saved);
      
    } catch (error) {
      console.error('Error saving posts:', error);
      this.showMessage('Error saving posts to storage.', 'error');
    }
  }

  // Export posts for use in blog page
  static getPosts() {
    try {
      const saved = localStorage.getItem('blogPosts');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading posts:', error);
      return [];
    }
  }
}

// Initialize dashboard when DOM is loaded and user is authenticated
document.addEventListener('DOMContentLoaded', () => {
  // Wait for authentication to complete
  const checkAuth = () => {
    if (window.dashboardAuth && window.dashboardAuth.isAuthenticated) {
      console.log('User authenticated, initializing dashboard...');
      new BlogDashboard();
    } else if (window.dashboardAuth && !window.dashboardAuth.isAuthenticated) {
      console.log('User not authenticated, dashboard will not initialize');
      return; // Don't initialize if user is not authenticated
    } else {
      // Authentication system not ready yet, wait a bit more
      setTimeout(checkAuth, 100);
    }
  };
  checkAuth();
});

// Export for use in other scripts
window.BlogDashboard = BlogDashboard;
