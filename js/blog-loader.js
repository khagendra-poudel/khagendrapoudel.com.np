// Blog Posts Loader
class BlogLoader {
  constructor() {
    this.posts = [];
    this.init();
  }

  init() {
    console.log('BlogLoader: Initializing...');
    this.loadPosts();
    this.renderPosts();
    this.setupRefreshListener();
  }

  loadPosts() {
    try {
      const saved = localStorage.getItem('blogPosts');
      console.log('BlogLoader: Raw saved data:', saved);
      
      if (saved) {
        this.posts = JSON.parse(saved);
        console.log('BlogLoader: Loaded posts:', this.posts);
      } else {
        this.posts = [];
        console.log('BlogLoader: No saved posts found');
      }
    } catch (error) {
      console.error('BlogLoader: Error loading posts:', error);
      this.posts = [];
    }
  }

  renderPosts() {
    console.log('BlogLoader: Rendering posts...');
    
    const blogGrid = document.getElementById('blogGrid');
    const emptyState = document.getElementById('emptyBlogState');

    if (!blogGrid || !emptyState) {
      console.error('BlogLoader: Required elements not found');
      return;
    }

    if (this.posts.length === 0) {
      console.log('BlogLoader: No posts to display, showing empty state');
      blogGrid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    console.log('BlogLoader: Displaying', this.posts.length, 'posts');
    blogGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    blogGrid.innerHTML = this.posts.map(post => this.createPostCard(post)).join('');
    
    // Add click event listeners to the new posts
    this.setupPostEventListeners();
  }

  createPostCard(post) {
    console.log('BlogLoader: Creating card for post:', post.title);
    
    const categoryIcons = {
      'Development': 'fas fa-code',
      'Design': 'fas fa-palette',
      'Technology': 'fas fa-brain',
      'Career': 'fas fa-rocket',
      'Mobile': 'fas fa-mobile-alt',
      'Security': 'fas fa-shield-alt'
    };

    const icon = categoryIcons[post.category] || 'fas fa-newspaper';
    
    return `
      <article class="blog-card" data-post-id="${post.id}">
        <div class="blog-image">
          ${post.image ? 
            `<img src="${post.image}" alt="${post.title}" style="width: 100%; height: 100%; object-fit: cover;">` :
            `<div class="blog-placeholder">
              <i class="${icon}"></i>
            </div>`
          }
        </div>
        <div class="blog-content">
          <div class="blog-meta">
            <span class="blog-date">${new Date(post.date).toLocaleDateString()}</span>
            <span class="blog-category">${post.category}</span>
          </div>
          <h3 class="blog-title">${post.title}</h3>
          <p class="blog-excerpt">${post.excerpt}</p>
          ${post.tags && post.tags.length > 0 ? `
            <div class="blog-tags">
              ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          ` : ''}
          <a href="#" class="read-more" data-post-id="${post.id}">
            Read More
            <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      </article>
    `;
  }

  setupPostEventListeners() {
    const readMoreLinks = document.querySelectorAll('.read-more[data-post-id]');
    readMoreLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const postId = link.getAttribute('data-post-id');
        this.showFullPost(postId);
      });
    });
  }

  setupRefreshListener() {
    // Manual refresh button
    const refreshBtn = document.getElementById('refreshBlogBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        console.log('BlogLoader: Manual refresh button clicked');
        this.refresh();
      });
    }

    // Refresh posts when page becomes visible (for when returning from dashboard)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('BlogLoader: Page became visible, refreshing posts...');
        this.loadPosts();
        this.renderPosts();
      }
    });

    // Also refresh when window gains focus
    window.addEventListener('focus', () => {
      console.log('BlogLoader: Window gained focus, refreshing posts...');
      this.loadPosts();
      this.renderPosts();
    });
  }

  showFullPost(postId) {
    console.log('BlogLoader: Showing full post:', postId);
    
    const posts = this.posts;
    const post = posts.find(p => p.id === postId);
    
    if (!post) {
      console.error('BlogLoader: Post not found:', postId);
      alert('Post not found!');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${post.title}</h3>
          <button class="modal-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="full-post">
            <div class="post-meta">
              <span>${new Date(post.date).toLocaleDateString()}</span>
              <span class="post-category">${post.category}</span>
            </div>
            ${post.image ? `<img src="${post.image}" alt="${post.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">` : ''}
            <div class="post-excerpt" style="font-style: italic; color: var(--text-secondary); margin-bottom: 2rem;">
              ${post.excerpt}
            </div>
            <div class="post-content">
              ${this.formatContent(post.content)}
            </div>
            ${post.tags && post.tags.length > 0 ? `
              <div class="post-tags" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Add event listeners
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => this.closeFullPost(modal));

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeFullPost(modal);
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeFullPost(modal);
    });
  }

  closeFullPost(modal) {
    if (modal && modal.parentNode) {
      modal.remove();
      document.body.style.overflow = '';
    }
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

  // Public method to refresh posts
  refresh() {
    console.log('BlogLoader: Manual refresh requested');
    this.loadPosts();
    this.renderPosts();
  }
}

// Initialize blog loader when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('BlogLoader: DOM loaded, initializing...');
  window.blogLoader = new BlogLoader();
});

// Export for use in other scripts
window.BlogLoader = BlogLoader;
