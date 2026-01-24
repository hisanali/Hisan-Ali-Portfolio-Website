// ===================================
// Modern Portfolio JavaScript
// ===================================

// Sneaky Peeker Character in Hero Section
document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    // Create the sneaky character peeking from the right side
    const peeker = document.createElement('div');
    peeker.className = 'sneaky-peeker';
    peeker.innerHTML = `
        <div class="thought-bubble"><span class="typing-text"></span></div>
        <div class="peeker-face">
            <div class="peeker-eyes">
                <div class="peeker-eye left-eye">
                    <div class="pupil"></div>
                </div>
                <div class="peeker-eye right-eye">
                    <div class="pupil"></div>
                </div>
            </div>
        </div>
    `;
    hero.appendChild(peeker);

    // Click to scroll to contact section
    peeker.addEventListener('click', () => {
        document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Typing effect for thought bubble
    const typingText = peeker.querySelector('.typing-text');
    const messages = ["Hi, I'm watching you", "Click me to contact Hisan"];
    let messageIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let isPaused = false;

    function typeEffect() {
        const currentMessage = messages[messageIndex];

        if (!isDeleting && charIndex <= currentMessage.length) {
            typingText.textContent = currentMessage.substring(0, charIndex);
            charIndex++;
            setTimeout(typeEffect, 50);
        } else if (!isDeleting && charIndex > currentMessage.length) {
            isPaused = true;
            setTimeout(() => {
                isDeleting = true;
                typeEffect();
            }, 1500);
        } else if (isDeleting && charIndex > 0) {
            typingText.textContent = currentMessage.substring(0, charIndex - 1);
            charIndex--;
            setTimeout(typeEffect, 25);
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            messageIndex = (messageIndex + 1) % messages.length;
            setTimeout(typeEffect, 500);
        }
    }

    typeEffect();

    // Add styles for the peeker
    const peekerStyles = document.createElement('style');
    peekerStyles.textContent = `
        .sneaky-peeker {
            position: absolute;
            right: -30px;
            bottom: 20%;
            width: 80px;
            height: 100px;
            z-index: 10;
            transition: transform 0.3s ease;
            cursor: pointer;
        }
        .peeker-face {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #6528F7, #A855F7);
            border-radius: 50% 0 0 50%;
            position: relative;
            box-shadow: -5px 0 20px rgba(101, 40, 247, 0.3);
        }
        .peeker-eyes {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-70%, -50%);
            display: flex;
            gap: 12px;
        }
        .peeker-eye {
            width: 18px;
            height: 18px;
            background: white;
            border-radius: 50%;
            position: relative;
            overflow: hidden;
        }
        .pupil {
            width: 10px;
            height: 10px;
            background: #1a1a2e;
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            transition: transform 0.1s ease;
        }
        .sneaky-peeker:hover {
            transform: translateX(-20px);
        }
        .sneaky-peeker:hover .peeker-face {
            animation: wiggle 0.5s ease;
        }
        @keyframes wiggle {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-5deg); }
            75% { transform: rotate(5deg); }
        }
        .thought-bubble {
            position: absolute;
            right: 90px;
            top: -10px;
            background: white;
            color: #1a1a2e;
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            white-space: nowrap;
            opacity: 0;
            transform: scale(0.8) translateX(20px);
            transition: all 0.3s ease;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            pointer-events: none;
        }
        .thought-bubble::after {
            content: '';
            position: absolute;
            right: -8px;
            top: 50%;
            transform: translateY(-50%);
            border: 8px solid transparent;
            border-left-color: white;
        }
        .sneaky-peeker:hover .thought-bubble {
            opacity: 1;
            transform: scale(1) translateX(0);
        }
        .thought-bubble.pop {
            animation: popIn 0.3s ease;
        }
        @keyframes popIn {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(peekerStyles);

    // Make eyes follow cursor
    const leftPupil = peeker.querySelector('.left-eye .pupil');
    const rightPupil = peeker.querySelector('.right-eye .pupil');

    document.addEventListener('mousemove', (e) => {
        const peekerRect = peeker.getBoundingClientRect();
        const peekerCenterX = peekerRect.left + peekerRect.width / 2;
        const peekerCenterY = peekerRect.top + peekerRect.height / 2;

        const angle = Math.atan2(e.clientY - peekerCenterY, e.clientX - peekerCenterX);
        const distance = 3;

        const pupilX = Math.cos(angle) * distance;
        const pupilY = Math.sin(angle) * distance;

        leftPupil.style.transform = `translate(calc(-50% + ${pupilX}px), calc(-50% + ${pupilY}px))`;
        rightPupil.style.transform = `translate(calc(-50% + ${pupilX}px), calc(-50% + ${pupilY}px))`;
    });
});

// Hero Background Effect - Cursor-following Orbs
document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    // Create orbs container
    const orbsContainer = document.createElement('div');
    orbsContainer.className = 'hero-orbs';
    orbsContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        pointer-events: none;
        z-index: 1;
    `;
    hero.style.position = 'relative';
    hero.insertBefore(orbsContainer, hero.firstChild);

    // Create orbs that follow cursor - more visible with dramatic movement
    const orbConfigs = [
        { size: 300, color: 'rgba(139, 92, 246, 0.5)', baseX: 15, baseY: 25, speed: 1 },
        { size: 250, color: 'rgba(236, 72, 153, 0.45)', baseX: 65, baseY: 15, speed: 0.7 },
        { size: 220, color: 'rgba(249, 115, 22, 0.4)', baseX: 75, baseY: 55, speed: 0.85 },
        { size: 200, color: 'rgba(139, 92, 246, 0.45)', baseX: 25, baseY: 65, speed: 1.2 },
        { size: 180, color: 'rgba(236, 72, 153, 0.4)', baseX: 45, baseY: 45, speed: 1.5 }
    ];

    const orbs = [];

    orbConfigs.forEach((config, i) => {
        const orb = document.createElement('div');
        orb.style.cssText = `
            position: absolute;
            width: ${config.size}px;
            height: ${config.size}px;
            background: radial-gradient(circle, ${config.color} 0%, transparent 70%);
            border-radius: 50%;
            left: ${config.baseX}%;
            top: ${config.baseY}%;
            filter: blur(50px);
        `;
        orbsContainer.appendChild(orb);
        orbs.push({ element: orb, config, currentX: 0, currentY: 0 });
    });

    // Track mouse position
    let mouseX = 0;
    let mouseY = 0;

    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) / rect.width - 0.5;
        mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    });

    hero.addEventListener('mouseleave', () => {
        mouseX = 0;
        mouseY = 0;
    });

    // Animate orbs towards cursor with dramatic movement
    function animate() {
        orbs.forEach((orb) => {
            // Much larger movement range - up to 150px based on speed
            const targetX = mouseX * 300 * orb.config.speed;
            const targetY = mouseY * 300 * orb.config.speed;

            // Faster response for more immediate feel
            orb.currentX += (targetX - orb.currentX) * 0.15;
            orb.currentY += (targetY - orb.currentY) * 0.15;

            orb.element.style.transform = `translate(${orb.currentX}px, ${orb.currentY}px)`;
        });
        requestAnimationFrame(animate);
    }
    animate();
});

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
// Form Validation and Submission
// ===================================

const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = contactForm.querySelector('#name').value.trim();
        const email = contactForm.querySelector('#email').value.trim();
        const subject = contactForm.querySelector('#subject').value.trim();
        const message = contactForm.querySelector('#message').value.trim();

        // Basic validation
        if (!name || !email || !subject || !message) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Please enter a valid email address.', 'error');
            return;
        }

        // Get the submit button
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        // Disable button and show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Sending...</span><i class="fas fa-spinner fa-spin"></i>';

        // Simulate form submission (replace with actual API call)
        setTimeout(() => {
            console.log('Form submitted:', { name, email, subject, message });

            // Show success message
            showNotification('Thank you for your message! I will get back to you soon.', 'success');

            // Reset form
            contactForm.reset();

            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }, 1500);

        // For actual implementation, use this structure:
        /*
        try {
            const response = await fetch('YOUR_API_ENDPOINT', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, subject, message })
            });

            if (response.ok) {
                showNotification('Thank you for your message! I will get back to you soon.', 'success');
                contactForm.reset();
            } else {
                showNotification('Something went wrong. Please try again.', 'error');
            }
        } catch (error) {
            showNotification('Unable to send message. Please email me directly.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
        */
    });
}

// Notification helper function
function showNotification(message, type = 'success') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // Add to body
    document.body.appendChild(notification);

    // Add styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 30px;
                padding: 18px 24px;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                animation: slideInRight 0.3s ease;
                max-width: 400px;
            }

            .notification-success {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
            }

            .notification-error {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
            }

            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 15px;
            }

            .notification-content i {
                font-size: 20px;
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @media (max-width: 768px) {
                .notification {
                    top: 80px;
                    right: 16px;
                    left: 16px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Show notification
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
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
