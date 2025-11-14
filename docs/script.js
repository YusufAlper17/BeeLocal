// BeeLocal Landing Page - JavaScript

// ==================== Mobile Menu Toggle ====================
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
        
        // Close mobile menu when clicking a link
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.add('hidden');
            });
        });
    }
});

// ==================== Platform Detection ====================
function detectPlatform() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const platform = window.navigator.platform.toLowerCase();
    
    if (platform.includes('mac') || userAgent.includes('mac')) {
        return 'macOS';
    } else if (platform.includes('win') || userAgent.includes('windows')) {
        return 'Windows';
    } else if (platform.includes('linux') || userAgent.includes('linux')) {
        return 'Linux';
    }
    return 'unknown';
}

// ==================== Get Latest Release Version ====================
async function getLatestReleaseVersion() {
    try {
        const response = await fetch('https://api.github.com/repos/YusufAlper17/BeeLocal/releases/latest');
        if (!response.ok) {
            throw new Error('Release bilgisi alınamadı');
        }
        const data = await response.json();
        // Tag formatından versiyonu çıkar (örn: "v1.0.0" -> "1.0.0")
        const version = data.tag_name.replace(/^v/, '');
        return { version, tag: data.tag_name };
    } catch (error) {
        console.warn('Latest release bilgisi alınamadı, varsayılan versiyon kullanılıyor:', error);
        // Fallback: package.json'dan veya varsayılan versiyon
        return { version: '1.0.0', tag: 'v1.0.0' };
    }
}

// ==================== Update Download Links ====================
async function updateDownloadLinks() {
    const { version, tag } = await getLatestReleaseVersion();
    const baseUrl = `https://github.com/YusufAlper17/BeeLocal/releases/latest/download`;
    
    // Update all download links on the page
    const links = document.querySelectorAll('a[href*="releases/download"], a[href*="releases/latest"]');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (href.includes('1.0.0') || href.includes('1.0.1'))) {
            // Replace version in URL with latest
            const newHref = href.replace(/\/releases\/download\/v[\d.]+/, baseUrl)
                                 .replace(/\/releases\/latest\/download\/BeeLocal-[\d.]+/, `${baseUrl}/BeeLocal-${version}`)
                                 .replace(/BeeLocal-[\d.]+-/, `BeeLocal-${version}-`);
            link.setAttribute('href', newHref);
        }
    });
    
    return { version, tag, baseUrl };
}

function updatePrimaryDownloadButton() {
    const platform = detectPlatform();
    const downloadBtn = document.getElementById('primary-download-btn');
    const downloadText = document.getElementById('primary-download-text');
    
    if (!downloadBtn || !downloadText) return;
    
    // Get latest release version
    getLatestReleaseVersion().then(({ version, tag }) => {
        const baseUrl = `https://github.com/YusufAlper17/BeeLocal/releases/latest/download`;
        
        const downloadLinks = {
            'macOS': {
                text: 'macOS için İndir',
                url: `${baseUrl}/BeeLocal-${version}-arm64.dmg`
            },
            'Windows': {
                text: 'Windows için İndir',
                url: `${baseUrl}/BeeLocal-Setup-${version}-win-x64.exe`
            },
            'Linux': {
                text: 'Linux için İndir',
                url: `${baseUrl}/BeeLocal-${version}-linux-x64.AppImage`
            },
            'unknown': {
                text: 'İndir',
                url: '#download'
            }
        };
        
        const platformData = downloadLinks[platform];
        downloadText.textContent = platformData.text;
        downloadBtn.href = platformData.url;
        
        // If unknown platform, scroll to download section instead
        if (platform === 'unknown') {
            downloadBtn.addEventListener('click', function(e) {
                e.preventDefault();
                document.getElementById('download').scrollIntoView({ behavior: 'smooth' });
            });
        }
    });
}

// ==================== Update Download Links Dynamically ====================
async function updateAllDownloadLinks() {
    try {
        const { version, tag, baseUrl } = await updateDownloadLinks();
        
        // Update download links with data attributes
        const downloadLinks = {
            'windows-setup': `${baseUrl}/BeeLocal-Setup-${version}-win-x64.exe`,
            'windows-portable': `${baseUrl}/BeeLocal-Portable-${version}-win-x64.exe`,
            'macos-arm64-dmg': `${baseUrl}/BeeLocal-${version}-arm64.dmg`,
            'macos-x64-dmg': `${baseUrl}/BeeLocal-${version}-x64.dmg`,
            'linux-appimage': `${baseUrl}/BeeLocal-${version}-linux-x64.AppImage`,
            'linux-deb': `${baseUrl}/BeeLocal-${version}-linux-x64.deb`
        };
        
        // Update links with data attributes
        Object.keys(downloadLinks).forEach(type => {
            const link = document.querySelector(`a[data-download-type="${type}"]`);
            if (link) {
                link.href = downloadLinks[type];
            }
        });
        
        // Update version badge if exists
        const versionBadge = document.getElementById('version-badge');
        if (versionBadge) {
            versionBadge.textContent = `Versiyon ${version}`;
        }
        
        console.log(`✅ İndirme linkleri güncellendi: v${version}`);
    } catch (error) {
        console.warn('İndirme linkleri güncellenirken hata:', error);
    }
}

// Run platform detection and update links when page loads
document.addEventListener('DOMContentLoaded', function() {
    updatePrimaryDownloadButton();
    updateAllDownloadLinks();
});

// ==================== Smooth Scroll ====================
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll for all anchor links
    const anchors = document.querySelectorAll('a[href^="#"]');
    
    anchors.forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if href is just "#"
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                
                // Offset for fixed header
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// ==================== Back to Top Button ====================
document.addEventListener('DOMContentLoaded', function() {
    const backToTopButton = document.getElementById('back-to-top');
    
    if (backToTopButton) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('show');
            } else {
                backToTopButton.classList.remove('show');
            }
        });
        
        // Scroll to top when clicked
        backToTopButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});

// ==================== Scroll Animations ====================
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

function handleScrollAnimations() {
    const animatedElements = document.querySelectorAll('.feature-card, .download-card, .screenshot-card, .faq-card');
    
    animatedElements.forEach((element, index) => {
        if (isElementInViewport(element) && !element.classList.contains('fade-in-up')) {
            setTimeout(() => {
                element.classList.add('fade-in-up');
            }, index * 100);
        }
    });
}

// Run on scroll and on page load
document.addEventListener('DOMContentLoaded', function() {
    handleScrollAnimations();
    window.addEventListener('scroll', handleScrollAnimations);
});

// ==================== Download Analytics (Optional) ====================
// Track download clicks
document.addEventListener('DOMContentLoaded', function() {
    const downloadButtons = document.querySelectorAll('a[href*="releases/download"], a[href$=".dmg"], a[href$=".exe"], a[href$=".AppImage"], a[href$=".deb"]');
    
    downloadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const platform = this.textContent.trim();
            console.log('Download clicked:', platform);
            
            // Here you can add analytics tracking if needed
            // Example: gtag('event', 'download', { 'platform': platform });
        });
    });
});

// ==================== Copy to Clipboard (for code blocks) ====================
document.addEventListener('DOMContentLoaded', function() {
    const codeBlocks = document.querySelectorAll('code');
    
    codeBlocks.forEach(code => {
        // Add click handler to copy
        code.style.cursor = 'pointer';
        code.title = 'Kopyalamak için tıklayın';
        
        code.addEventListener('click', function() {
            const text = this.textContent;
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    // Show copied feedback
                    const originalText = this.textContent;
                    this.textContent = 'Kopyalandı!';
                    
                    setTimeout(() => {
                        this.textContent = originalText;
                    }, 1000);
                }).catch(err => {
                    console.error('Kopyalama başarısız:', err);
                });
            }
        });
    });
});

// ==================== Copy macOS Command ====================
function copyMacCommand(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    
    const commandElement = document.getElementById('mac-command');
    const command = commandElement ? commandElement.textContent.trim() : '';
    
    if (!command) {
        console.error('Komut bulunamadı');
        return;
    }
    
    navigator.clipboard.writeText(command).then(() => {
        // Button feedback
        const btn = evt.currentTarget || evt.target.closest('.command-copy-btn-final');
        if (btn) {
            btn.classList.add('copied');
            const span = btn.querySelector('.command-copy-text-final');
            if (span) {
                const originalText = span.textContent;
                span.textContent = 'Kopyalandı!';
                setTimeout(() => {
                    span.textContent = originalText;
                    btn.classList.remove('copied');
                }, 2000);
            }
        }
        
        // Show bubble popup
        showCopySuccessBubble();
    }).catch(err => {
        console.error('Kopyalama başarısız:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = command;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showCopySuccessBubble();
        } catch (fallbackErr) {
            console.error('Fallback kopyalama da başarısız:', fallbackErr);
        }
        document.body.removeChild(textArea);
    });
}

// ==================== Show Copy Success Bubble ====================
function showCopySuccessBubble() {
    const bubble = document.getElementById('copy-success-bubble');
    if (!bubble) return;
    
    // Remove any existing show class
    bubble.classList.remove('show');
    
    // Force reflow
    void bubble.offsetWidth;
    
    // Show bubble
    bubble.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        bubble.classList.remove('show');
    }, 3000);
}

// ==================== Keyboard Navigation ====================
document.addEventListener('keydown', function(e) {
    // Escape key to close mobile menu
    if (e.key === 'Escape') {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
        }
    }
    
    // Arrow up to scroll to top
    if (e.ctrlKey && e.key === 'Home') {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
});

// ==================== External Links ====================
// Open external links in new tab
document.addEventListener('DOMContentLoaded', function() {
    const externalLinks = document.querySelectorAll('a[href^="http"]');
    
    externalLinks.forEach(link => {
        // Skip if already has target attribute
        if (!link.hasAttribute('target')) {
            // Check if link is external
            if (!link.href.includes(window.location.hostname)) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        }
    });
});

// ==================== Performance: Lazy Load Images ====================
document.addEventListener('DOMContentLoaded', function() {
    // Add lazy loading to all images
    const images = document.querySelectorAll('img[src]');
    
    if ('loading' in HTMLImageElement.prototype) {
        images.forEach(img => {
            if (!img.hasAttribute('loading')) {
                img.loading = 'lazy';
            }
        });
    } else {
        // Fallback for browsers that don't support lazy loading
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
});

// ==================== Active Navigation Link ====================
document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    
    function updateActiveLink() {
        let currentSection = '';
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        // Find the current section
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            // Check if we're in this section (with offset for header)
            if (scrollPosition >= sectionTop - 150 && scrollPosition < sectionTop + sectionHeight - 150) {
                currentSection = section.getAttribute('id');
            }
        });
        
        // If at the very top, no section is active
        if (scrollPosition < 200) {
            currentSection = '';
        }
        
        // Update active class on all nav links
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            if (currentSection && href === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }
    
    // Throttle scroll event for performance
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (scrollTimeout) {
            window.cancelAnimationFrame(scrollTimeout);
        }
        scrollTimeout = window.requestAnimationFrame(function() {
            updateActiveLink();
        });
    });
    
    // Call once on page load
    updateActiveLink();
});

// ==================== Console Message ====================
console.log('%c🐝 BeeLocal', 'font-size: 24px; font-weight: bold; color: #f59e0b;');
console.log('%cİTÜ Ninova Dosya Senkronizasyon Uygulaması', 'font-size: 14px; color: #6b7280;');
console.log('%cGitHub: https://github.com/YusufAlper17/BeeLocal', 'font-size: 12px; color: #3b82f6;');
console.log('%cMade with ❤️ by İTÜ Students', 'font-size: 12px; color: #10b981;');

