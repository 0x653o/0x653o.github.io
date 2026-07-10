document.addEventListener('DOMContentLoaded', () => {
    let currentLang = 'en';
    let globalData = null;

    // 1. Fetch Data
    fetch('/data.json?t=' + new Date().getTime())
        .then(response => response.json())
        .then(data => {
            globalData = data;
            render(currentLang);
            initLanguageToggle();
            initModal();
        })
        .catch(err => console.error('Error loading data:', err));

    function render(lang) {
        const data = globalData[lang];
        if (!data) return;

        // User Info
        setText('user-location', data.user.location);
        setText('user-role', data.user.role);
        setText('system-status', data.user.status);
        if (document.getElementById('hero-name-container')) {
            document.getElementById('hero-name-container').innerHTML = `${data.user.name} <span class="italic">${data.user.handle}</span>`;
        }
        setText('hero-subtitle', data.user.bio);
        
        // Labels
        setText('label-about', data.labels.timeline ? data.en ? "ABOUT" : data.labels.about || "ABOUT" : "ABOUT"); 
        // Re-mapping labels for clarity
        setText('label-about', data.about.title);
        setText('label-timeline', data.labels.timeline);
        setText('label-now', data.labels.now);
        setText('label-interests', data.labels.interests);
        setText('label-community', data.labels.community);
        setText('label-works', data.labels.works);
        setText('label-stack', data.labels.stack);

        // Content
        setText('about-text', data.about.content);
        const contactLink = document.getElementById('contact-link');
        if (contactLink) {
            contactLink.href = `mailto:${data.user.email}`;
            contactLink.textContent = data.labels.contact;
        }

        // Affiliations
        renderList('affiliations-container', data.affiliations, (item) => `<div class="aff-item">${item}</div>`);

        // Timeline (History) - Split Layout
        renderList('timeline-container', data.timeline, (item, index) => {
            const isEven = index % 2 === 0;
            const detail = (item.detail || '').replace(/ \/ /g, '<br>');
            return `
                <div class="tl-item">
                    <div class="tl-left">
                        ${isEven ? `
                            <div class="tl-year-large">${item.year}</div>
                            <div class="tl-event-text">${item.event}</div>
                        ` : `
                            <div class="tl-detail-text">${detail}</div>
                        `}
                    </div>
                    <div class="tl-node"></div>
                    <div class="tl-right">
                        ${!isEven ? `
                            <div class="tl-year-large">${item.year}</div>
                            <div class="tl-event-text">${item.event}</div>
                        ` : `
                            <div class="tl-detail-text">${detail}</div>
                        `}
                    </div>
                </div>
            `;
        });

        // Currently
        renderList('now-container', data.now, (item) => `<span>${item}</span>`);

        // Focus / Interests
        renderList('interests-container', data.interests, (item) => `<span>${item}</span>`);

        // Community
        renderList('community-container', data.community, (item) => `
            <div class="community-entry">
                <h3>${item.org}</h3>
                <p>${item.role}</p>
            </div>
        `);

        // Projects
        renderList('projects-container', data.projects, (item) => `
            <a href="${item.link || '#'}" class="project-row" ${item.link ? 'target="_blank"' : ''}>
                <span class="pr-year">${item.year}</span>
                <span class="pr-title">${item.title}</span>
                <span class="pr-tag">${item.tag}</span>
            </a>
        `);

        // Skills
        renderList('skills-container', data.skills, (item) => `<span>${item}</span>`);

        // Footer
        if (document.getElementById('copyright-text')) {
            document.getElementById('copyright-text').innerHTML = `&copy; ${new Date().getFullYear()} ARCHIVE_mu1aq. ALL RIGHTS RESERVED.`;
        }

        initAnimations();
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function renderList(containerId, list, templateFn) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = list.map(templateFn).join('');
        }
    }

    function initLanguageToggle() {
        const enBtn = document.getElementById('lang-en');
        const koBtn = document.getElementById('lang-ko');

        enBtn.addEventListener('click', () => {
            if (currentLang === 'en') return;
            currentLang = 'en';
            updateLangUI();
            render('en');
        });

        koBtn.addEventListener('click', () => {
            if (currentLang === 'ko') return;
            currentLang = 'ko';
            updateLangUI();
            render('ko');
        });
    }

    function updateLangUI() {
        document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`lang-${currentLang}`).classList.add('active');
    }

    // ---- Modal: blog list & gpg key ----
    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function openModal(title, bodyHtml) {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay) return;
        setText('modal-title', title);
        document.getElementById('modal-body').innerHTML = bodyHtml;
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay) return;
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function openBlogModal() {
        const data = globalData[currentLang] || {};
        const blogs = data.blogs || [];
        const title = (data.labels && data.labels.blogs) || 'BLOG';
        let body;
        if (blogs.length) {
            const rows = blogs.map((b) => `
                <a href="${b.url}" target="_blank" rel="noopener" class="mention-row">
                    <span class="mention-handle">${b.handle}</span>
                    <span class="mention-platform">${b.platform}</span>
                    <span class="mention-arrow">&#8599;</span>
                </a>
            `).join('');
            body = `<div class="mention-list">${rows}</div>`;
        } else {
            body = `<p class="modal-empty">No blogs configured yet.</p>`;
        }
        openModal(title, body);
    }

    function openGpgModal() {
        const data = globalData[currentLang] || {};
        const key = (globalData && globalData.gpg) || '';
        const title = (data.labels && data.labels.gpg) || 'GPG PUBLIC KEY';
        let body;
        if (key) {
            body = `<pre class="gpg-key">${escapeHtml(key)}</pre>
                    <div class="gpg-actions"><button id="gpg-copy" class="gpg-copy">COPY</button></div>`;
        } else {
            body = `<p class="modal-empty">No GPG key configured yet.</p>`;
        }
        openModal(title, body);
        const copyBtn = document.getElementById('gpg-copy');
        if (copyBtn && navigator.clipboard) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(key).then(() => {
                    copyBtn.textContent = 'COPIED';
                    setTimeout(() => { copyBtn.textContent = 'COPY'; }, 1500);
                });
            });
        }
    }

    function openDiscordModal() {
        const data = globalData[currentLang] || {};
        const dc = globalData.discord || {};
        const title = (data.labels && data.labels.discord) || 'DISCORD';
        const body = `
            <div class="discord-card">
                <div class="discord-handle">${dc.handle || ''}</div>
                <div class="discord-server">${dc.server || ''}</div>
                <a href="${dc.invite}" target="_blank" rel="noopener" class="discord-join">JOIN SERVER &#8599;</a>
            </div>`;
        openModal(title, body);
    }

    function openConnectModal() {
        const data = globalData[currentLang] || {};
        const links = data.links || [];
        const title = (data.labels && data.labels.links) || 'CONNECT';
        const rows = links.map((l) => `
            <a href="${l.url || '#connect'}" ${l.url ? 'target="_blank" rel="noopener"' : ''} class="mention-row">
                <span class="mention-handle">${l.platform}</span>
                <span class="mention-id">${l.label}</span>
                <span class="mention-arrow">&#8599;</span>
            </a>
        `).join('');
        openModal(title, `<div class="mention-list">${rows}</div>`);
    }

    function routeHash() {
        const hash = location.hash;
        if (hash === '#blog') openBlogModal();
        else if (hash === '#gpg') openGpgModal();
        else if (hash === '#discord') openDiscordModal();
        else if (hash === '#connect') openConnectModal();
        else closeModal();
    }

    function initModal() {
        const overlay = document.getElementById('modal-overlay');
        const blogLink = document.getElementById('blog-link');
        const gpgLink = document.getElementById('gpg-link');

        if (blogLink) blogLink.addEventListener('click', (e) => {
            e.preventDefault();
            openBlogModal();
            history.replaceState(null, '', '#blog');
        });
        if (gpgLink) gpgLink.addEventListener('click', (e) => {
            e.preventDefault();
            openGpgModal();
            history.replaceState(null, '', '#gpg');
        });

        const discordLink = document.getElementById('discord-link');
        if (discordLink) discordLink.addEventListener('click', (e) => {
            e.preventDefault();
            openDiscordModal();
            history.replaceState(null, '', '#discord');
        });

        const connectLink = document.getElementById('connect-link');
        if (connectLink) connectLink.addEventListener('click', (e) => {
            e.preventDefault();
            openConnectModal();
            history.replaceState(null, '', '#connect');
        });

        const clearAndClose = () => {
            closeModal();
            history.replaceState(null, '', location.pathname + location.search);
        };
        const closeBtn = document.getElementById('modal-close');
        if (closeBtn) closeBtn.addEventListener('click', clearAndClose);
        if (overlay) overlay.addEventListener('click', (e) => {
            if (e.target === overlay) clearAndClose();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') clearAndClose();
        });

        window.addEventListener('hashchange', routeHash);
        routeHash(); // open on initial load if URL has #blog / #gpg
    }

    function initAnimations() {
        const observerOptions = { threshold: 0.1 };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }

    // Ambient Glow Parallax
    document.addEventListener('mousemove', (e) => {
        const glow = document.querySelector('.ambient-glow');
        if (!glow) return;
        const x = (e.clientX / window.innerWidth - 0.5) * 50;
        const y = (e.clientY / window.innerHeight - 0.5) * 50;
        glow.style.transform = `translate(${x}px, ${y}px)`;
    });
});
