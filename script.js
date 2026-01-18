// ===================================
// Modern Portfolio JavaScript
// ===================================

// Preloader
window.addEventListener('load', () => {
    const preloader = document.querySelector('.preloader');
    setTimeout(() => {
        preloader.classList.add('hide');
    }, 1000);
});

// ===================================
// Navigation
// ===================================

const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const header = document.querySelector('.header');

// Mobile menu toggle
hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// Active nav link on scroll
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });

    // Header shadow on scroll
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ===================================
// Smooth Scrolling
// ===================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ===================================
// Counter Animation
// ===================================

const counters = document.querySelectorAll('.counter');
let counterAnimated = false;

const animateCounters = () => {
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };

        updateCounter();
    });
    counterAnimated = true;
};

// Trigger counter animation when stats section is in view
const statsSection = document.querySelector('.stats-section');
if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !counterAnimated) {
                animateCounters();
            }
        });
    }, { threshold: 0.5 });

    statsObserver.observe(statsSection);
}

// ===================================
// Scroll Animations
// ===================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe sections
document.querySelectorAll('section:not(.hero)').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    fadeInObserver.observe(section);
});

// Observe service cards
document.querySelectorAll('.service-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    fadeInObserver.observe(card);
});

// Observe portfolio items
document.querySelectorAll('.portfolio-item').forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(30px)';
    item.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    fadeInObserver.observe(item);
});

// Observe testimonial cards
document.querySelectorAll('.testimonial-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    fadeInObserver.observe(card);
});

// ===================================
// Back to Top Button
// ===================================

const backToTopBtn = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// ===================================
// Typing Effect for Hero Title (Optional)
// ===================================

const createTypingEffect = (element, text, speed = 100) => {
    let i = 0;
    element.textContent = '';

    const type = () => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    };

    type();
};

// ===================================
// Parallax Effect for Hero Background
// ===================================

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-bg');

    if (hero && scrolled <= window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// ===================================
// Dynamic Year in Footer
// ===================================

const yearSpan = document.querySelector('.footer-bottom p');
if (yearSpan) {
    const currentYear = new Date().getFullYear();
    yearSpan.textContent = yearSpan.textContent.replace('2026', currentYear);
}

// ===================================
// Mouse Follower Effect (Optional - Advanced)
// ===================================

const cursor = document.createElement('div');
cursor.classList.add('cursor-follower');
document.body.appendChild(cursor);

let mouseX = 0;
let mouseY = 0;
let cursorX = 0;
let cursorY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

const animateCursor = () => {
    const speed = 0.2;
    cursorX += (mouseX - cursorX) * speed;
    cursorY += (mouseY - cursorY) * speed;

    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';

    requestAnimationFrame(animateCursor);
};

// Only enable cursor follower on desktop
if (window.innerWidth > 768) {
    animateCursor();
}

// Add hover effect to links and buttons
const interactiveElements = document.querySelectorAll('a, button, .service-card, .portfolio-item');
interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursor.style.transform = 'scale(2)';
        cursor.style.backgroundColor = 'rgba(101, 40, 247, 0.3)';
    });

    el.addEventListener('mouseleave', () => {
        cursor.style.transform = 'scale(1)';
        cursor.style.backgroundColor = 'rgba(101, 40, 247, 0.5)';
    });
});

// Add CSS for cursor follower
const style = document.createElement('style');
style.textContent = `
    .cursor-follower {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: rgba(101, 40, 247, 0.5);
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        transition: transform 0.2s ease, background-color 0.2s ease;
        mix-blend-mode: difference;
    }

    @media (max-width: 768px) {
        .cursor-follower {
            display: none;
        }
    }
`;
document.head.appendChild(style);

// ===================================
// Portfolio Filter (if needed)
// ===================================

const portfolioFilters = document.querySelectorAll('.portfolio-filter-btn');
const portfolioItems = document.querySelectorAll('.portfolio-item');

if (portfolioFilters.length > 0) {
    portfolioFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            // Remove active class from all filters
            portfolioFilters.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked filter
            filter.classList.add('active');

            const filterValue = filter.getAttribute('data-filter');

            portfolioItems.forEach(item => {
                if (filterValue === 'all' || item.classList.contains(filterValue)) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(30px)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

// ===================================
// Form Validation (if contact form exists)
// ===================================

const contactForm = document.querySelector('.contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = contactForm.querySelector('input[name="name"]').value;
        const email = contactForm.querySelector('input[name="email"]').value;
        const message = contactForm.querySelector('textarea[name="message"]').value;

        if (name && email && message) {
            // Form is valid, you can send data here
            console.log('Form submitted:', { name, email, message });

            // Show success message
            alert('Thank you for your message! I will get back to you soon.');
            contactForm.reset();
        } else {
            alert('Please fill in all fields.');
        }
    });
}

// ===================================
// Scroll Progress Indicator
// ===================================

const createScrollProgress = () => {
    const progressBar = document.createElement('div');
    progressBar.classList.add('scroll-progress');
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.pageYOffset / windowHeight) * 100;
        progressBar.style.width = scrolled + '%';
    });

    const progressStyle = document.createElement('style');
    progressStyle.textContent = `
        .scroll-progress {
            position: fixed;
            top: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, #6528F7, #A855F7);
            z-index: 10001;
            transition: width 0.1s ease;
        }
    `;
    document.head.appendChild(progressStyle);
};

createScrollProgress();

// ===================================
// Lazy Loading Images (if you add images)
// ===================================

const lazyImages = document.querySelectorAll('img[data-src]');

if (lazyImages.length > 0) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src');
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
}

// ===================================
// Console Message
// ===================================

console.log('%c👋 Hello! Thanks for checking out my portfolio!', 'color: #6528F7; font-size: 20px; font-weight: bold;');
console.log('%cInterested in working together? Let\'s connect!', 'color: #A855F7; font-size: 14px;');
console.log('%cEmail: hisanali73@gmail.com', 'color: #4ECDC4; font-size: 12px;');

// ===================================
// Performance Optimization
// ===================================

// Debounce function for scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Use debounce for expensive scroll operations
window.addEventListener('scroll', debounce(() => {
    // Any expensive scroll operations can go here
}, 100));
