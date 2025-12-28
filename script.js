/* SUPABASE CONFIG */
const SUPABASE_URL = "https://jsmjeabqsalmsmetxzwo.supabase.co";
const SUPABASE_KEY = "sb_publishable_Ep_tNJypQz35Z-qdMpNh9Q_fjLmTKPM";

let supabaseClient = null;

async function ensureSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    // If Supabase UMD is already loaded, create client immediately
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        return supabaseClient;
    }

    // Otherwise dynamically load the Supabase UMD bundle from unpkg
    await new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-supabase-umd]');
        if (existing) {
            existing.addEventListener('load', resolve);
            existing.addEventListener('error', reject);
            return;
        }
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/@supabase/supabase-js@2/dist/umd/index.js';
        s.async = true;
        s.setAttribute('data-supabase-umd', '1');
        s.onload = () => resolve();
        s.onerror = (e) => reject(e);
        document.head.appendChild(s);
    });

    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        return supabaseClient;
    }

    throw new Error('Supabase library failed to load');
}

/* AUTH: LOGIN */
async function login(email, password) {
    try {
        const client = await ensureSupabaseClient();
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
            alert(error.message || 'Login failed');
            return;
        }
        window.location.href = "user-dashboard.html";
    } catch (err) {
        console.error(err);
        alert('Unable to sign in at this time');
    }
}

/* AUTH: LOGOUT */
async function logout() {
    try {
        const client = await ensureSupabaseClient();
        await client.auth.signOut();
    } catch (err) {
        console.warn('Logout error', err);
    }
    window.location.href = "login.html";
}

/* PAYMENT VERIFICATION */
async function verifyPayment(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    try {
        const nameEl = document.getElementById("name");
        const phoneEl = document.getElementById("phone");
        const planEl = document.getElementById("plan");
        const name = nameEl ? nameEl.value : '';
        const phone = phoneEl ? phoneEl.value : '';
        const plan = planEl ? planEl.value : '';

        const client = await ensureSupabaseClient();
        const { error } = await client.from("payments").insert([{ name, phone, plan, status: "pending" }]);

        if (error) {
            alert(error.message || "Payment failed");
        } else {
            alert("Payment submitted successfully");
        }
    } catch (err) {
        console.error(err);
        alert('Unable to submit payment at this time');
    }
}

// Expose functions for use from inline handlers or other scripts
window.login = login;
window.logout = logout;
window.verifyPayment = verifyPayment;

// Toast notification helpers (in-page toasts shown at top-right)
function _ensureToastStyles() {
    if (document.getElementById('ime-toast-styles')) return;
    const s = document.createElement('style');
    s.id = 'ime-toast-styles';
    s.textContent = `
      #ime_toast_container{position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;align-items:flex-end}
      .ime-toast{background:#222;color:#fff;padding:10px 14px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,0.15);max-width:320px;word-break:break-word;opacity:0;transform:translateY(-10px);transition:opacity .25s,transform .25s}
      .ime-toast--success{background:linear-gradient(90deg,#16a34a,#059669)}
      .ime-toast--error{background:linear-gradient(90deg,#dc2626,#b91c1c)}
    `;
    document.head.appendChild(s);
}

function notify(message, opts = {}) {
    try {
        _ensureToastStyles();
        const id = 'ime_toast_container';
        let container = document.getElementById(id);
        if (!container) {
            container = document.createElement('div');
            container.id = id;
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'ime-toast ' + ((opts && opts.type === 'success') ? 'ime-toast--success' : 'ime-toast--error');
        toast.textContent = message || '';
        container.appendChild(toast);

        // animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        const duration = (opts && opts.duration) || 3000;
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => toast.remove(), 250);
        }, duration);

        return toast;
    } catch (e) {
        console.warn('notify error', e);
        return null;
    }
}

window.notify = notify;

