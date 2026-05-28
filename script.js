document.addEventListener('DOMContentLoaded', () => {

    // --- 1. PRELOADER ---
    const preloader = document.querySelector('.preloader');
    setTimeout(() => {
        preloader.style.opacity = "0";
        setTimeout(() => {
            preloader.style.display = "none";
        }, 800);
    }, 1000);

    
    // --- MOBILE MENU LOGIC ---
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const mobileOverlay = document.querySelector('.mobile-menu-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    if(mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            mobileBtn.classList.toggle('open');
            mobileOverlay.classList.toggle('open');
            if(mobileOverlay.classList.contains('open') && lenis) {
                lenis.stop();
            } else if(lenis) {
                lenis.start();
            }
        });

        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileBtn.classList.remove('open');
                mobileOverlay.classList.remove('open');
                if(lenis) lenis.start();
            });
        });
    }


    // --- 2. LENIS SMOOTH SCROLL ---
    const lenis = (typeof Lenis !== 'undefined') ? new Lenis({
        duration: 0.8,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    }) : null;

    function raf(time) {
        if(lenis) lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);


    // --- HERO SCROLL BUTTON (MOBILE) ---
    const heroUnlockBtn = document.getElementById('hero-unlock-btn');
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile && heroUnlockBtn) {
        heroUnlockBtn.addEventListener('click', () => {
            if (lenis) {
                // Smoothly scroll down slightly
                lenis.scrollTo(window.innerHeight * 0.15, { duration: 1.2 });
            } else {
                window.scrollBy({ top: window.innerHeight * 0.15, behavior: 'smooth' });
            }
            
            // Hide the button smoothly
            heroUnlockBtn.style.opacity = '0';
            heroUnlockBtn.style.transform = 'translateX(-50%) translateY(20px)';
            heroUnlockBtn.style.pointerEvents = 'none';
            setTimeout(() => {
                heroUnlockBtn.style.display = 'none';
            }, 500);
        });
    }

    // --- 3. STEAM CANVAS EFFECT ---
    const canvas = document.getElementById('steam-canvas');
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let particles = [];
    let isMouseMoving = false;
    let mouseTimeout;
    let mouseX = -1000;
    let mouseY = -1000;

    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Changed to window instead of canvas so text blocks don't hide the event
    window.addEventListener('mousemove', (e) => {
        if (window.innerWidth < 768) return; // Desktop only for interactive drawing
        
        // Only emit if we are roughly in the top part of the page (hero section)
        if (e.clientY < window.innerHeight * 1.5) {
            mouseX = e.clientX;
            // Adjust mouse Y to match canvas local coordinates 
            mouseY = e.clientY + window.scrollY;
            
            // Limit emission to the top section visually
            if (mouseY < window.innerHeight) {
                isMouseMoving = true;
                clearTimeout(mouseTimeout);
                mouseTimeout = setTimeout(() => { isMouseMoving = false; }, 500);
            }
        }
    });

    // No touch support for steam on mobile - strictly ambient background effect only.

    class Particle {
        constructor(x, y, isMobileAmbient = false) {
            this.x = x + (Math.random() * 40 - 20);
            this.y = y + (Math.random() * 40 - 20);
            
            if (isMobileAmbient) {
                // Mobile: soft drifting, rising slowly, ambient movement
                this.vx = (Math.random() - 0.5) * 0.3;
                this.vy = -(Math.random() * 0.8 + 0.3); 
                this.decay = Math.random() * 0.005 + 0.002; // longer life, fades naturally
                this.size = Math.random() * 40 + 40; // softer, larger
            } else {
                // Desktop: original interactive feel
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = -(Math.random() * 1.5 + 0.5); 
                this.decay = Math.random() * 0.01 + 0.005;
                this.size = Math.random() * 30 + 30;
            }
            this.life = 1; 
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= this.decay;
            this.size += 0.5; 
        }
        draw() {
            if (this.life <= 0) return;
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
            // warm cream/white transparency
            grad.addColorStop(0, `rgba(245, 239, 230, ${this.life * 0.12})`);
            grad.addColorStop(1, 'rgba(245, 239, 230, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function createParticle(x, y, isMobileAmbient = false) {
        particles.push(new Particle(x, y, isMobileAmbient));
    }

    function animateSteam() {
        requestAnimationFrame(animateSteam);
        
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            // Completely disable canvas drawing on mobile for max smoothness
            return; 
        }

        ctx.clearRect(0, 0, width, height);
        
        if (isMouseMoving) {
            // Desktop Interactive Drawing
            createParticle(mouseX, mouseY, false);
            if (Math.random() > 0.3) createParticle(mouseX, mouseY, false);
        } else {
            // Ambient Emission (Desktop Idle)
            if (Math.random() < 0.05) {
                createParticle(width / 2, height - 100, false);
            }
        }
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].life <= 0) {
                particles.splice(i, 1);
                i--;
            }
        }
    }
    animateSteam();

    // --- 4. GALLERY FADE-IN ---
    const handleScroll = (windowHeight) => {
        const galleryItems = document.querySelectorAll('.gallery-item');
        galleryItems.forEach((item) => {
            const rect = item.getBoundingClientRect();
            if (rect.top < windowHeight * 0.85) {
                item.classList.add('visible');
            }
        });
    };

    if(lenis) {
        lenis.on('scroll', () => handleScroll(window.innerHeight));
    } else {
        window.addEventListener('scroll', () => handleScroll(window.innerHeight));
    }
    window.dispatchEvent(new Event('scroll'));

    // --- 5. 3D TILT ON MENU BOARD ---
    const tiltBoard = document.querySelector('.tilt-board');
    if (tiltBoard) {
        window.addEventListener('mousemove', (e) => {
            const rect = tiltBoard.getBoundingClientRect();
            if(e.clientX > rect.left - 50 && e.clientX < rect.right + 50 && 
               e.clientY > rect.top - 50 && e.clientY < rect.bottom + 50) {
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                // Very subtle tilt
                const rotateX = -((e.clientY - centerY) / (rect.height / 2)) * 3;
                const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * 3;
                
                tiltBoard.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            } else {
                tiltBoard.style.transform = `perspective(1500px) rotateX(0deg) rotateY(0deg)`;
            }
        });
    }
});