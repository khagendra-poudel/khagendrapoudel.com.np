// Page Transition and Animation Management
class PageTransitions {
  constructor() {
    this.isTransitioning = false;
    this.currentPage = window.location.pathname;
    this.init();
  }

  init() {
    this.createTransitionOverlay();
    this.setupNavigation();
    this.setupScrollEffects();
    this.setupIntersectionObserver();
    this.handlePageLoad();
  }

  createTransitionOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'page-transition';
    document.body.appendChild(overlay);
    this.transitionOverlay = overlay;
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Skip if it's the same page or external link
        if (href === this.currentPage || href.startsWith('http') || href.startsWith('#')) {
          return;
        }

        e.preventDefault();
        this.navigateToPage(href);
      });
    });
  }

  async navigateToPage(url) {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    
    // Start transition out
    this.transitionOverlay.classList.add('active');
    
    // Wait for transition to complete
    await this.wait(600);
    
    // Navigate to new page
    window.location.href = url;
  }

  setupScrollEffects() {
    let lastScrollY = window.scrollY;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      
      // Hide/show header based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        header.classList.add('hidden');
      } else {
        header.classList.remove('hidden');
      }
      
      lastScrollY = currentScrollY;
    });
  }

  setupIntersectionObserver() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Observe all cards and sections
    const elements = document.querySelectorAll('.project-card, .blog-card, .note-card, .notes-category');
    elements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
      observer.observe(el);
    });
  }

  handlePageLoad() {
    // Remove transition overlay on page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.transitionOverlay.classList.remove('active');
      }, 100);
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
      this.currentPage = window.location.pathname;
      this.updateActiveNavigation();
    });

    this.updateActiveNavigation();
  }

  updateActiveNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname;
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === currentPath || 
          (currentPath === '/' && link.getAttribute('href') === 'index.html')) {
        link.classList.add('active');
      }
    });
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Smooth scrolling for anchor links
class SmoothScroller {
  constructor() {
    this.setupSmoothScrolling();
  }

  setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }
}

// Parallax and floating effects
class ParallaxEffects {
  constructor() {
    this.setupParallax();
    this.setupFloatingElements();
  }

  setupParallax() {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const parallaxElements = document.querySelectorAll('.profile-photo, .project-card, .blog-card');
      
      parallaxElements.forEach((element, index) => {
        const speed = 0.5 + (index * 0.1);
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });
    });
  }

  setupFloatingElements() {
    const floatingElements = document.querySelectorAll('.profile-photo, .note-icon');
    
    floatingElements.forEach((element, index) => {
      element.style.animationDelay = `${index * 0.2}s`;
    });
  }
}

// Card hover effects and interactions
class CardInteractions {
  constructor() {
    this.setupCardEffects();
    this.setupMagneticEffect();
  }

  setupCardEffects() {
    const cards = document.querySelectorAll('.project-card, .blog-card, .note-card, .social-link');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', (e) => {
        this.addHoverEffect(e.target);
      });
      
      card.addEventListener('mouseleave', (e) => {
        this.removeHoverEffect(e.target);
      });
    });
  }

  addHoverEffect(element) {
    element.style.transform = 'translateY(-8px) scale(1.02)';
    element.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
  }

  removeHoverEffect(element) {
    element.style.transform = 'translateY(0) scale(1)';
    element.style.boxShadow = '';
  }

  setupMagneticEffect() {
    const magneticElements = document.querySelectorAll('.nav-link, .project-link, .read-more');
    
    magneticElements.forEach(element => {
      element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        element.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
      });
      
      element.addEventListener('mouseleave', () => {
        element.style.transform = 'translate(0, 0)';
      });
    });
  }
}

// Loading animations and performance optimization
class PerformanceOptimizer {
  constructor() {
    this.setupLazyLoading();
    this.setupImageOptimization();
  }

  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach(img => imageObserver.observe(img));
    }
  }

  setupImageOptimization() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.addEventListener('load', () => {
        img.style.opacity = '1';
        img.style.transform = 'scale(1)';
      });
      
      img.style.opacity = '0';
      img.style.transform = 'scale(0.95)';
      img.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    });
  }
}

// Initialize all features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PageTransitions();
  new SmoothScroller();
  new ParallaxEffects();
  new CardInteractions();
  new PerformanceOptimizer();
  
  // Add loading animation
  document.body.classList.add('loaded');
});

// Handle page visibility changes for better performance
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    document.body.classList.add('page-hidden');
  } else {
    document.body.classList.remove('page-hidden');
  }
});

// Add CSS for additional animations
const additionalStyles = `
  .page-hidden {
    animation-play-state: paused;
  }
  
  .loaded {
    animation: fadeIn 0.8s ease-out forwards;
  }
  
  .nav-link.magnetic {
    transition: transform 0.1s ease-out;
  }
  
  .card-hover {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .lazy {
    opacity: 0;
    transition: opacity 0.3s ease-out;
  }
  
  .lazy.loaded {
    opacity: 1;
  }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
