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
            initSidebar();
            initModal();
        })
        .catch(err => console.error('Error loading data:', err));

    initRepos();

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
        setText('label-works', data.labels.works);
        setText('label-stack', data.labels.stack);
        setText('label-archive', data.labels.archive);
        setText('label-repos', data.labels.repos);
        setText('label-cve', data.labels.cve);

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
            const archiveLink = item.group
                ? `<a class="tl-archive-link" href="#archive-${item.group}">ARCHIVE &#8599;</a>` : '';
            return `
                <div class="tl-item">
                    <div class="tl-left">
                        ${isEven ? `
                            <div class="tl-year-large">${item.year}</div>
                            <div class="tl-event-text">${item.event}</div>
                            ${archiveLink}
                        ` : `
                            <div class="tl-detail-text">${detail}</div>
                        `}
                    </div>
                    <div class="tl-node"></div>
                    <div class="tl-right">
                        ${!isEven ? `
                            <div class="tl-year-large">${item.year}</div>
                            <div class="tl-event-text">${item.event}</div>
                            ${archiveLink}
                        ` : `
                            <div class="tl-detail-text">${detail}</div>
                        `}
                    </div>
                </div>
            `;
        });

        renderArchive(data);

        // Currently
        renderList('now-container', data.now, (item) => `<span>${item}</span>`);

        // Focus / Interests
        renderList('interests-container', data.interests, (item) => `<span>${item}</span>`);

        // Projects
        renderList('projects-container', data.projects, (item) => `
            <a href="${item.link || '#'}" class="project-row" ${item.link ? 'target="_blank"' : ''}>
                <span class="pr-year">${item.year}</span>
                <span class="pr-title">${item.title}</span>
                <span class="pr-tag">${item.tag}</span>
            </a>
        `);

        // Disclosed CVEs (from the IPCam embedded project)
        renderCves(data);

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

    // ---- Archive: history + projects merged by shared "group" key ----
    function renderArchive(data) {
        const container = document.getElementById('archive-container');
        if (!container) return;
        const projByGroup = {};
        (data.projects || []).forEach((p) => { if (p.group) projByGroup[p.group] = p; });
        const merged = new Set();
        const rows = [];
        (data.timeline || []).forEach((t, i) => {
            const p = t.group ? projByGroup[t.group] : null;
            if (p) merged.add(t.group);
            rows.push({
                id: t.group || 'h' + i,
                year: t.year,
                title: t.event,
                sub: p ? p.title : (t.detail || ''),
                link: p ? p.link : '',
                tag: p ? 'HISTORY + PROJECT' : 'HISTORY'
            });
        });
        (data.projects || []).forEach((p, i) => {
            if (p.group && merged.has(p.group)) return;
            rows.push({ id: p.group || 'p' + i, year: p.year, title: p.title, sub: p.tag, link: p.link, tag: 'PROJECT' });
        });
        container.innerHTML = rows.map((r) => {
            const inner = `
                <span class="ar-year">${r.year}</span>
                <span class="ar-main">
                    <span class="ar-title">${r.title}</span>
                    ${r.sub ? `<span class="ar-sub">${r.sub}</span>` : ''}
                </span>
                <span class="ar-tag">${r.tag}${r.link ? ' &#8599;' : ''}</span>
            `;
            return r.link
                ? `<a id="archive-${r.id}" class="archive-row" href="${r.link}" target="_blank" rel="noopener">${inner}</a>`
                : `<div id="archive-${r.id}" class="archive-row">${inner}</div>`;
        }).join('');
    }

    // ---- Disclosed CVEs (linked to cve.org records) ----
    function renderCves(data) {
        const container = document.getElementById('cve-container');
        if (!container) return;
        const cves = data.cves || [];
        if (!cves.length) { container.innerHTML = ''; return; }
        const ipcam = (data.projects || []).find((p) => p.group === 'ipcam');
        const note = (data.labels && data.labels.cveNote) || '';
        const noteHtml = note
            ? (ipcam && ipcam.link
                ? `<a class="cve-note" href="${ipcam.link}" target="_blank" rel="noopener">${note} &#8599;</a>`
                : `<span class="cve-note">${note}</span>`)
            : '';
        const chips = cves.map((id) =>
            `<a class="cve-item" href="https://www.cve.org/CVERecord?id=${encodeURIComponent(id)}" target="_blank" rel="noopener">${id} &#8599;</a>`
        ).join('');
        container.innerHTML = `${noteHtml}<div class="cve-chips">${chips}</div>`;
    }

    // ---- Public GitHub repos (live, unauthenticated API) ----
    function initRepos() {
        const container = document.getElementById('repos-container');
        if (!container) return;
        fetch('https://api.github.com/users/mu1aq/repos?per_page=100&sort=updated')
            .then((r) => r.ok ? r.json() : Promise.reject(r.status))
            .then((repos) => {
                const own = repos.filter((r) => !r.fork);
                container.innerHTML = own.map((r) => `
                    <a class="repo-item" href="${r.html_url}" target="_blank" rel="noopener">
                        <span class="repo-head">
                            <span class="repo-name">${escapeHtml(r.name)}</span>
                            <span class="repo-lang">${escapeHtml(r.language || '')} &#8599;</span>
                        </span>
                        ${r.description ? `<span class="repo-desc">${escapeHtml(r.description)}</span>` : ''}
                    </a>
                `).join('');
            })
            .catch(() => {
                container.innerHTML = '<p class="modal-empty">Failed to load repositories.</p>';
            });
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

    // ---- Layer stack: sidebar / modal ----
    // Overlay click and ESC close only the top-most layer, so a modal
    // opened from the sidebar pops back to the still-open sidebar.
    const layerStack = [];

    function pushLayer(name, container) {
        if (layerStack.some((l) => l.name === name)) return;
        layerStack.push({ name, container, trigger: document.activeElement });
        document.body.style.overflow = 'hidden';
    }

    function removeLayer(name) {
        const idx = layerStack.map((l) => l.name).lastIndexOf(name);
        if (idx === -1) return;
        const [layer] = layerStack.splice(idx, 1);
        if (!layerStack.length) document.body.style.overflow = '';
        if (layer.trigger && typeof layer.trigger.focus === 'function') layer.trigger.focus();
    }

    // visibility transitions leave the layer computed-hidden at open time;
    // focus after the first paint so the element is focusable
    function focusWhenVisible(el) {
        if (!el) return;
        requestAnimationFrame(() => requestAnimationFrame(() => el.focus()));
    }

    function closeTopLayer() {
        const top = layerStack[layerStack.length - 1];
        if (!top) return;
        if (top.name === 'modal') closeModalAndClearHash();
        else closeSidebar();
    }

    // ESC pops top layer; Tab is trapped inside the top layer.
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTopLayer();
            return;
        }
        if (e.key !== 'Tab' || !layerStack.length) return;
        const top = layerStack[layerStack.length - 1];
        const focusables = top.container.querySelectorAll('a[href], button:not([disabled])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!top.container.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });

    // ---- Sidebar ----
    function openSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        pushLayer('sidebar', sidebar);
        sidebar.classList.add('open');
        sidebar.setAttribute('aria-hidden', 'false');
        document.getElementById('sidebar-overlay').classList.add('open');
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
        focusWhenVisible(document.getElementById('sidebar-close'));
    }

    function closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        sidebar.classList.remove('open');
        sidebar.setAttribute('aria-hidden', 'true');
        document.getElementById('sidebar-overlay').classList.remove('open');
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
        removeLayer('sidebar');
    }

    function initSidebar() {
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) menuBtn.addEventListener('click', openSidebar);
        const closeBtn = document.getElementById('sidebar-close');
        if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
        const overlay = document.getElementById('sidebar-overlay');
        if (overlay) overlay.addEventListener('click', closeSidebar);
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
        pushLayer('modal', overlay);
        setText('modal-title', title);
        document.getElementById('modal-body').innerHTML = bodyHtml;
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        focusWhenVisible(document.getElementById('modal-close'));
    }

    function closeModal() {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay) return;
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        removeLayer('modal');
    }

    function closeModalAndClearHash() {
        closeModal();
        history.replaceState(null, '', location.pathname + location.search);
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

        const closeBtn = document.getElementById('modal-close');
        if (closeBtn) closeBtn.addEventListener('click', closeModalAndClearHash);
        if (overlay) overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModalAndClearHash();
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
