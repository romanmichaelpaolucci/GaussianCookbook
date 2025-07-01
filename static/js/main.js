// The Gaussian Cookbook - Main JavaScript
class GaussianCookbook {
    constructor() {
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupSimulations();
        this.setupScrollEffects();
        this.setupMobileMenu();
        this.setupMathJax();
    }

    // Navigation and scrolling
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('section[id]');

        // Smooth scrolling for navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Active navigation highlighting
        window.addEventListener('scroll', () => {
            let current = '';
            const scrollPosition = window.scrollY + 100;

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }

    // Interactive simulations
    setupSimulations() {
        const canvas = document.getElementById('process-canvas');
        const ctx = canvas.getContext('2d');
        const generateBtn = document.getElementById('generate-btn');
        const processType = document.getElementById('process-type');
        const hurstParam = document.getElementById('hurst-param');
        const timeSteps = document.getElementById('time-steps');
        const hurstValue = document.getElementById('hurst-value');
        const stepsValue = document.getElementById('steps-value');

        // Update display values
        hurstParam.addEventListener('input', () => {
            hurstValue.textContent = hurstParam.value;
        });

        timeSteps.addEventListener('input', () => {
            stepsValue.textContent = timeSteps.value;
        });

        // Generate process button
        generateBtn.addEventListener('click', () => {
            this.generateProcess(ctx, canvas, {
                type: processType.value,
                hurst: parseFloat(hurstParam.value),
                steps: parseInt(timeSteps.value)
            });
        });

        // Initial generation
        this.generateProcess(ctx, canvas, {
            type: 'brownian',
            hurst: 0.5,
            steps: 500
        });
    }

    // Generate different types of Gaussian processes
    generateProcess(ctx, canvas, params) {
        const { type, hurst, steps } = params;
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Generate data based on process type
        let data;
        switch (type) {
            case 'brownian':
                data = this.generateBrownianMotion(steps);
                break;
            case 'fractional':
                data = this.generateFractionalBrownianMotion(steps, hurst);
                break;
            case 'bridge':
                data = this.generateBrownianBridge(steps);
                break;
            case 'ornstein':
                data = this.generateOrnsteinUhlenbeck(steps);
                break;
            default:
                data = this.generateBrownianMotion(steps);
        }

        // Calculate statistics
        const stats = this.calculateStats(data);
        this.updateStats(stats);

        // Draw the process
        this.drawProcess(ctx, data, width, height, padding, type);
    }

    // Generate standard Brownian motion
    generateBrownianMotion(steps) {
        const data = [0];
        for (let i = 1; i < steps; i++) {
            const increment = this.boxMuller() * Math.sqrt(1 / steps);
            data.push(data[i - 1] + increment);
        }
        return data;
    }

    // Generate fractional Brownian motion using Cholesky decomposition
    generateFractionalBrownianMotion(steps, hurst) {
        const data = new Array(steps).fill(0);
        const covariance = this.generateCovarianceMatrix(steps, hurst);
        
        // Cholesky decomposition (simplified)
        for (let i = 0; i < steps; i++) {
            let sum = 0;
            for (let j = 0; j < i; j++) {
                sum += covariance[i][j] * data[j];
            }
            data[i] = sum + this.boxMuller() * Math.sqrt(covariance[i][i] - sum * sum);
        }
        
        return data;
    }

    // Generate Brownian bridge
    generateBrownianBridge(steps) {
        const brownian = this.generateBrownianMotion(steps);
        const bridge = [];
        
        for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1);
            bridge.push(brownian[i] - t * brownian[steps - 1]);
        }
        
        return bridge;
    }

    // Generate Ornstein-Uhlenbeck process
    generateOrnsteinUhlenbeck(steps) {
        const data = [0];
        const theta = 1.0; // mean reversion speed
        const mu = 0.0;    // long-term mean
        const sigma = 1.0; // volatility
        const dt = 1.0 / steps;
        
        for (let i = 1; i < steps; i++) {
            const drift = theta * (mu - data[i - 1]) * dt;
            const diffusion = sigma * Math.sqrt(dt) * this.boxMuller();
            data.push(data[i - 1] + drift + diffusion);
        }
        
        return data;
    }

    // Generate covariance matrix for fBm
    generateCovarianceMatrix(n, hurst) {
        const matrix = Array(n).fill().map(() => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const ti = i / (n - 1);
                const tj = j / (n - 1);
                matrix[i][j] = 0.5 * (Math.pow(ti, 2 * hurst) + Math.pow(tj, 2 * hurst) - Math.pow(Math.abs(ti - tj), 2 * hurst));
            }
        }
        
        return matrix;
    }

    // Box-Muller transform for normal random numbers
    boxMuller() {
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    // Calculate statistics
    calculateStats(data) {
        const n = data.length;
        const mean = data.reduce((sum, x) => sum + x, 0) / n;
        const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
        
        // Estimate Hurst parameter using R/S analysis
        const hurst = this.estimateHurst(data);
        
        return {
            mean: mean.toFixed(3),
            variance: variance.toFixed(3),
            hurst: hurst.toFixed(3)
        };
    }

    // Estimate Hurst parameter using R/S analysis
    estimateHurst(data) {
        const n = data.length;
        const maxLag = Math.min(n / 4, 50);
        const rsValues = [];
        const lags = [];
        
        for (let lag = 10; lag <= maxLag; lag += 5) {
            const rs = this.calculateRS(data, lag);
            if (rs > 0) {
                rsValues.push(Math.log(rs));
                lags.push(Math.log(lag));
            }
        }
        
        if (rsValues.length < 2) return 0.5;
        
        // Linear regression
        const slope = this.linearRegression(lags, rsValues);
        return Math.max(0.1, Math.min(0.9, slope));
    }

    // Calculate R/S statistic
    calculateRS(data, lag) {
        const n = data.length;
        const k = Math.floor(n / lag);
        let rsSum = 0;
        
        for (let i = 0; i < k; i++) {
            const segment = data.slice(i * lag, (i + 1) * lag);
            const mean = segment.reduce((sum, x) => sum + x, 0) / lag;
            const deviations = segment.map(x => x - mean);
            
            let cumsum = 0;
            const cumsums = [0];
            for (const dev of deviations) {
                cumsum += dev;
                cumsums.push(cumsum);
            }
            
            const R = Math.max(...cumsums) - Math.min(...cumsums);
            const S = Math.sqrt(segment.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / lag);
            
            if (S > 0) {
                rsSum += R / S;
            }
        }
        
        return rsSum / k;
    }

    // Simple linear regression
    linearRegression(x, y) {
        const n = x.length;
        const sumX = x.reduce((sum, xi) => sum + xi, 0);
        const sumY = y.reduce((sum, yi) => sum + yi, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    // Update statistics display
    updateStats(stats) {
        document.getElementById('mean-value').textContent = stats.mean;
        document.getElementById('variance-value').textContent = stats.variance;
        document.getElementById('estimated-hurst').textContent = stats.hurst;
    }

    // Draw the process on canvas
    drawProcess(ctx, data, width, height, padding, type) {
        const plotWidth = width - 2 * padding;
        const plotHeight = height - 2 * padding;
        
        // Find data range
        const minVal = Math.min(...data);
        const maxVal = Math.max(...data);
        const range = maxVal - minVal || 1;
        
        // Scale data to canvas
        const scaleX = plotWidth / (data.length - 1);
        const scaleY = plotHeight / range;
        
        // Draw background
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(padding, padding, plotWidth, plotHeight);
        
        // Draw grid
        this.drawGrid(ctx, width, height, padding, data.length, minVal, maxVal);
        
        // Draw process
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        data.forEach((value, index) => {
            const x = padding + index * scaleX;
            const y = padding + plotHeight - (value - minVal) * scaleY;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // Draw process type label
        ctx.fillStyle = '#374151';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(`${type.charAt(0).toUpperCase() + type.slice(1)} Process`, padding + 10, padding + 25);
    }

    // Draw grid
    drawGrid(ctx, width, height, padding, dataLength, minVal, maxVal) {
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        // Vertical lines
        const vSteps = Math.min(10, dataLength);
        for (let i = 0; i <= vSteps; i++) {
            const x = padding + (i * (width - 2 * padding)) / vSteps;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }
        
        // Horizontal lines
        const hSteps = 5;
        for (let i = 0; i <= hSteps; i++) {
            const y = padding + (i * (height - 2 * padding)) / hSteps;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
    }

    // Scroll effects
    setupScrollEffects() {
        // Parallax effect for hero background
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallax = document.querySelector('.gaussian-curve');
            if (parallax) {
                const speed = scrolled * 0.5;
                parallax.style.transform = `translateY(-50%) translateX(${speed}px)`;
            }
        });

        // Fade in animations for sections
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

        // Observe sections for animation
        document.querySelectorAll('section').forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(30px)';
            section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            observer.observe(section);
        });
    }

    // Mobile menu
    setupMobileMenu() {
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }
    }

    // MathJax setup
    setupMathJax() {
        // Wait for MathJax to load
        if (typeof MathJax !== 'undefined') {
            MathJax.Hub.Queue(['Typeset', MathJax.Hub]);
        } else {
            // Fallback for when MathJax is not loaded
            setTimeout(() => {
                this.setupMathJax();
            }, 100);
        }
    }
}

// Utility functions
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new GaussianCookbook();
    
    // Add loading animation
    document.body.classList.add('loaded');
    
    // Tabs for Articles/GitHub
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Console welcome message
    console.log(`
    🧮 Welcome to The Gaussian Cookbook!
    
    This interactive website provides comprehensive recipes for simulating 
    Gaussian processes including Brownian motion, fractional Brownian motion, 
    Brownian bridge, and more.
    
    Explore the chapters and try the interactive simulations!
    `);
});

// Add some fun easter eggs
document.addEventListener('keydown', (e) => {
    // Press 'G' to generate a new random process
    if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.altKey) {
        const generateBtn = document.getElementById('generate-btn');
        if (generateBtn) {
            generateBtn.click();
        }
    }
    
    // Press 'H' to show/hide help
    if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.altKey) {
        console.log(`
        🎯 Quick Help:
        - Press 'G' to generate a new process
        - Use the sliders to adjust parameters
        - Try different process types
        - Explore the chapters for detailed explanations
        `);
    }
}); 