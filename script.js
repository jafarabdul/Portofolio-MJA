/* ==========================================================
   Portofolio Mohammad Jafar Abdullah
   ========================================================== */

// ---------- Konfigurasi form kontak (isi salah satu) ----------
// Opsi 1: endpoint layanan form, contoh Formspree: "https://formspree.io/f/xxxxxxx"
const FORM_ENDPOINT = "";
// Opsi 2: alamat email tujuan. Form akan membuka aplikasi email pengunjung.
const CONTACT_EMAIL = "";

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Badge peran yang berganti ----------
(function roleRotator() {
    const badge = document.getElementById('roleBadge');
    if (!badge) return;

    const roles = ['E-Commerce Project', 'Web Developer', 'QA Testing', 'Bug Bounty'];
    let index = 0;

    setInterval(() => {
        badge.classList.add('out');
        setTimeout(() => {
            index = (index + 1) % roles.length;
            badge.textContent = roles[index];
            badge.classList.remove('out');
        }, 250);
    }, 2600);
})();

// ---------- Kartu gantung: ayunan bandul + bisa ditarik ----------
(function lanyard() {
    const swing = document.getElementById('swing');
    const card = document.getElementById('idCard');
    const wrap = document.getElementById('lanyard');
    if (!swing || !card || !wrap) return;

    const STIFFNESS = 14;   // makin besar, makin cepat berayun
    const DAMPING = 1.4;    // makin besar, makin cepat berhenti
    const MAX_ANGLE = 0.6;  // batas sudut (radian)

    let theta = prefersReducedMotion ? 0 : 0.2; // sudut awal, kartu langsung berayun saat dibuka
    let omega = 0;
    let dragging = false;
    let running = false;
    let lastTime = 0;
    let lastDragTheta = 0;
    let lastDragTime = 0;

    function render() {
        swing.style.transform = 'rotate(' + theta + 'rad)';
    }

    function step(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.032);
        lastTime = now;

        if (!dragging) {
            const acceleration = -STIFFNESS * Math.sin(theta) - DAMPING * omega;
            omega += acceleration * dt;
            theta += omega * dt;

            if (Math.abs(theta) < 0.0008 && Math.abs(omega) < 0.001) {
                theta = 0;
                omega = 0;
                running = false;
            }
        }

        render();
        if (running) requestAnimationFrame(step);
    }

    function start() {
        if (running) return;
        running = true;
        lastTime = performance.now();
        requestAnimationFrame(step);
    }

    function angleFromPointer(x, y) {
        const rect = wrap.getBoundingClientRect();
        const pivotX = rect.left + rect.width / 2;
        const pivotY = rect.top;
        const dy = Math.max(y - pivotY, 60);
        const angle = Math.atan2(-(x - pivotX), dy);
        return Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, angle));
    }

    card.addEventListener('pointerdown', (e) => {
        dragging = true;
        omega = 0;
        card.setPointerCapture(e.pointerId);
        lastDragTheta = theta;
        lastDragTime = performance.now();
        start();
    });

    card.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const now = performance.now();
        const next = angleFromPointer(e.clientX, e.clientY);
        const dt = (now - lastDragTime) / 1000;
        if (dt > 0) omega = (next - lastDragTheta) / dt;
        lastDragTheta = next;
        lastDragTime = now;
        theta = next;
    });

    function release() {
        if (!dragging) return;
        dragging = false;
        omega = Math.max(-6, Math.min(6, omega));
        start();
    }
    card.addEventListener('pointerup', release);
    card.addEventListener('pointercancel', release);

    render();
    if (!prefersReducedMotion) start();
})();

// ---------- Animasi muncul saat scroll + hitung angka ----------
(function reveal() {
    const items = document.querySelectorAll('.reveal');

    function countUp(el) {
        const target = parseInt(el.dataset.count, 10);
        if (isNaN(target) || prefersReducedMotion) return;
        const duration = 1200;
        const startTime = performance.now();

        function tick(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
            if (progress < 1) requestAnimationFrame(tick);
        }
        el.textContent = '0';
        requestAnimationFrame(tick);
    }

    if (!('IntersectionObserver' in window)) {
        items.forEach((el) => el.classList.add('in'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('in');
            entry.target.querySelectorAll('[data-count]').forEach(countUp);
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.15 });

    items.forEach((el) => observer.observe(el));
})();

// ---------- Form kontak ----------
(function contactForm() {
    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');
    if (!form || !status) return;

    function show(message, isError) {
        status.textContent = message;
        status.classList.toggle('error', Boolean(isError));
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const data = {
            name: form.name.value.trim(),
            email: form.email.value.trim(),
            message: form.message.value.trim()
        };

        if (FORM_ENDPOINT) {
            show('Mengirim...', false);
            try {
                const response = await fetch(FORM_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (!response.ok) throw new Error('HTTP ' + response.status);
                form.reset();
                show('Pesan berhasil dikirim!', false);
            } catch (err) {
                show('Gagal mengirim pesan. Coba lagi nanti.', true);
            }
            return;
        }

        if (CONTACT_EMAIL) {
            const subject = encodeURIComponent('Pesan dari portofolio: ' + data.name);
            const body = encodeURIComponent(data.message + '\n\nDari: ' + data.name + ' (' + data.email + ')');
            window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + subject + '&body=' + body;
            show('Membuka aplikasi email Anda...', false);
            return;
        }

        show('Form belum dikonfigurasi. Isi FORM_ENDPOINT atau CONTACT_EMAIL di script.js.', true);
    });
})();
