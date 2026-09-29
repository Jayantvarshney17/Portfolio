/**
 * Jayant Varshney - Developer Portfolio Scripts
 * Handles: Theme Toggle, Mobile Nav, ScrollSpy, Project Filtering,
 * Certificate Lightbox, GitHub API Repositories Fetch, Copy to Clipboard, and Contact Form.
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. THEME TOGGLE (Dark / Light Mode)
  // ==========================================
  const themeToggleBtn = document.getElementById('theme-toggle');
  const htmlRoot = document.documentElement;

  // Retrieve saved theme preference or system preference
  const savedTheme = localStorage.getItem('jv_portfolio_theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme) {
    htmlRoot.setAttribute('data-theme', savedTheme);
  } else if (!systemPrefersDark) {
    htmlRoot.setAttribute('data-theme', 'light');
  } else {
    htmlRoot.setAttribute('data-theme', 'dark');
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = htmlRoot.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      htmlRoot.setAttribute('data-theme', newTheme);
      localStorage.setItem('jv_portfolio_theme', newTheme);
    });
  }

  // ==========================================
  // 2. MOBILE NAVIGATION MENU
  // ==========================================
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('open');
    });

    // Close menu when clicking any nav link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target) && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ==========================================
  // 3. SCROLLSPY (Highlight active section in nav)
  // ==========================================
  const sections = document.querySelectorAll('section[id]');

  function updateActiveNav() {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      const sectionId = section.getAttribute('id');
      const correspondingLink = document.querySelector(`.nav-menu a[href="#${sectionId}"]`);

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        if (correspondingLink) {
          navLinks.forEach(link => link.classList.remove('active'));
          correspondingLink.classList.add('active');
        }
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  // ==========================================
  // 4. PROJECT CATEGORY FILTERING
  // ==========================================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(10px)';
          card.style.display = 'none';
        }
      });
    });
  });

  // ==========================================
  // 5. CERTIFICATE LIGHTBOX MODAL
  // ==========================================
  const certCards = document.querySelectorAll('.cert-card');
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const modalCertImg = document.getElementById('modal-cert-img');
  const modalCertTitle = document.getElementById('modal-cert-title');
  const modalCertMeta = document.getElementById('modal-cert-meta');
  const modalCertPdfLink = document.getElementById('modal-cert-pdf-link');

  function openCertModal(card) {
    const imgSrc = card.getAttribute('data-img');
    const pdfSrc = card.getAttribute('data-pdf');
    const title = card.getAttribute('data-title');
    const issuer = card.getAttribute('data-issuer');
    const date = card.getAttribute('data-date');

    if (modalCertImg) modalCertImg.src = imgSrc;
    if (modalCertTitle) modalCertTitle.textContent = title;
    if (modalCertMeta) modalCertMeta.textContent = `${issuer} • ${date}`;
    
    if (modalCertPdfLink) {
      if (pdfSrc) {
        modalCertPdfLink.href = pdfSrc;
        modalCertPdfLink.style.display = 'inline-flex';
      } else {
        modalCertPdfLink.style.display = 'none';
      }
    }

    if (lightboxModal) {
      lightboxModal.classList.add('active');
      lightboxModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCertModal() {
    if (lightboxModal) {
      lightboxModal.classList.remove('active');
      lightboxModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (modalCertImg) modalCertImg.src = '';
    }
  }

  certCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // If user clicked directly on "Open PDF" anchor link, don't open modal
      if (e.target.closest('a[target="_blank"]')) {
        return;
      }
      openCertModal(card);
    });
  });

  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeCertModal);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeCertModal);

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightboxModal && lightboxModal.classList.contains('active')) {
      closeCertModal();
    }
  });

  // ==========================================
  // 6. TOAST NOTIFICATION & CLIPBOARD COPY
  // ==========================================
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');
  let toastTimeout;

  function showToast(message) {
    if (!toast) return;
    if (toastText) toastText.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // Copy email hero button
  const copyEmailChip = document.getElementById('copy-email-chip');
  if (copyEmailChip) {
    copyEmailChip.addEventListener('click', () => {
      const email = copyEmailChip.getAttribute('data-email') || 'jatinvarshney939@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        showToast('Email address copied to clipboard!');
      }).catch(() => {
        showToast('jatinvarshney939@gmail.com');
      });
    });
  }

  // Copy buttons in contact section
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`Copied: ${textToCopy}`);
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
        }).catch(() => {
          showToast(`Copied: ${textToCopy}`);
        });
      }
    });
  });

  // ==========================================
  // 7. GITHUB API - DYNAMIC REPOSITORIES
  // ==========================================
  const reposContainer = document.getElementById('github-repos-grid');

  // Curated fallback repositories if GitHub API is offline or rate-limited
  const fallbackRepos = [
    {
      name: "Eagle-Insight",
      description: "Smart License Plate Detection & Stolen Car Alert System with OpenCV & OCR (Published Research).",
      language: "Python",
      stars: 4,
      forks: 1,
      html_url: "https://github.com/Jayantvarshney17"
    },
    {
      name: "Course-Enrollment-Tracker-LWC",
      description: "Salesforce CRM Course Enrollment & Attendance Tracker using Apex Triggers, Flows & LWC.",
      language: "Apex / JavaScript",
      stars: 3,
      forks: 0,
      html_url: "https://github.com/Jayantvarshney17"
    },
    {
      name: "First-Aid-Disease-Prediction",
      description: "Intelligent medical diagnosis assistant predicting probable conditions from symptoms.",
      language: "Python",
      stars: 2,
      forks: 0,
      html_url: "https://github.com/Jayantvarshney17"
    },
    {
      name: "Canteen-Order-Management",
      description: "Salesforce Retail CRM automating billing roll-ups, approval processes, and email alerts.",
      language: "Salesforce",
      stars: 2,
      forks: 0,
      html_url: "https://github.com/Jayantvarshney17"
    },
    {
      name: "Salesforce-Event-Registration",
      description: "Event capacity management, custom Profiles & Permission Sets, with 90%+ unit test coverage.",
      language: "Apex",
      stars: 2,
      forks: 0,
      html_url: "https://github.com/Jayantvarshney17"
    },
    {
      name: "React-Web-Applications",
      description: "Interactive real-time web applications, quiz engines, and responsive user interfaces.",
      language: "JavaScript",
      stars: 3,
      forks: 1,
      html_url: "https://github.com/Jayantvarshney17"
    }
  ];

  function renderRepos(repos) {
    if (!reposContainer) return;
    reposContainer.innerHTML = '';

    repos.slice(0, 6).forEach(repo => {
      const card = document.createElement('a');
      card.className = 'repo-card';
      card.href = repo.html_url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';

      const langColor = repo.language === 'Python' ? '#3572A5' :
                        repo.language === 'JavaScript' ? '#f1e05a' :
                        repo.language === 'Apex' ? '#1797c0' :
                        repo.language === 'HTML' ? '#e34c26' : '#3b82f6';

      card.innerHTML = `
        <div class="repo-name">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
          <span>${repo.name}</span>
        </div>
        <p class="repo-desc">${repo.description || 'Public development repository by Jayant Varshney.'}</p>
        <div class="repo-footer">
          <span class="repo-lang">
            <span class="lang-dot" style="background-color: ${langColor};"></span>
            ${repo.language || 'Code'}
          </span>
          <span>★ ${repo.stargazers_count !== undefined ? repo.stargazers_count : (repo.stars || 0)}</span>
        </div>
      `;

      reposContainer.appendChild(card);
    });
  }

  // Fetch live repositories from GitHub API
  fetch('https://api.github.com/users/Jayantvarshney17/repos?sort=updated&per_page=6')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        renderRepos(data);
      } else {
        renderRepos(fallbackRepos);
      }
    })
    .catch(() => {
      // Graceful fallback to pre-rendered portfolio projects
      renderRepos(fallbackRepos);
    });

  // ==========================================
  // 8. CONTACT FORM SUBMISSION
  // ==========================================
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const subjectInput = document.getElementById('contact-subject');
      const messageInput = document.getElementById('contact-message');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const subject = subjectInput ? subjectInput.value.trim() : 'Portfolio Contact Inquiry';
      const message = messageInput ? messageInput.value.trim() : '';

      if (!name || !email || !message) {
        if (formStatus) {
          formStatus.className = 'form-status error';
          formStatus.textContent = 'Please fill out all required fields.';
        }
        return;
      }

      // Disable button temporarily & display feedback
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Preparing message...</span>`;
      }

      // Prepare mailto link with encoded URI components
      const mailtoSubject = encodeURIComponent(`[Portfolio] ${subject}`);
      const mailtoBody = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
      const mailtoUrl = `mailto:jatinvarshney939@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;

      // Open user's default email client
      setTimeout(() => {
        window.location.href = mailtoUrl;

        if (formStatus) {
          formStatus.className = 'form-status success';
          formStatus.textContent = '✓ Message window initialized! You can also reach me directly at jatinvarshney939@gmail.com';
        }

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            <span>Send Another Message</span>
          `;
        }

        showToast('Email client opened to send message!');
      }, 600);
    });
  }

});
