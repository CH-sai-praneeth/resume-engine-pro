// ============================================================================
// GITHUB RUNNER - Drives the free, ephemeral Ollama pipeline from the browser
// ----------------------------------------------------------------------------
// When the user picks "Ollama" and clicks Generate, we don't need a local
// Ollama server. Instead we trigger the `ollama-resume.yml` GitHub Actions
// workflow (workflow_dispatch). GitHub spins up a fresh, free runner, installs
// and runs Llama 3, tailors the resume, commits the result back to
// generated/<run_id>.json, and the runner self-destructs automatically.
// This module dispatches the run, polls its status, and fetches the result.
//
// AUTH: a GitHub Personal Access Token is stored (obfuscated) in localStorage.
//   - Fine-grained token: this repo only, Actions = Read & write, Contents =
//     Read & write.
//   - Classic token: scopes `repo` + `workflow`.
// Because this is a static site (no backend), the token lives in the browser.
// Use a token scoped to just this one repo so the blast radius is minimal.
// ============================================================================

const GitHubRunner = {
    KEY_TOKEN: 'ghRunnerToken',
    KEY_CONFIG: 'ghRunnerConfig',

    defaults: {
        owner: 'rdammala',
        repo: 'resume-engine-pro',
        workflow: 'ollama-resume.yml',
        ref: 'master',
        model: 'llama3.2'
    },

    // ----- token & config -----
    setToken(t) { StorageManager.set(this.KEY_TOKEN, String(t || '').trim(), true); },
    getToken() { return StorageManager.get(this.KEY_TOKEN, true) || ''; },
    hasToken() { return !!this.getToken(); },
    clearToken() { StorageManager.remove(this.KEY_TOKEN); },

    setConfig(cfg) {
        const clean = {};
        Object.keys(cfg || {}).forEach(k => {
            if (cfg[k] !== undefined && cfg[k] !== null && String(cfg[k]).trim() !== '') clean[k] = String(cfg[k]).trim();
        });
        StorageManager.set(this.KEY_CONFIG, { ...(StorageManager.get(this.KEY_CONFIG) || {}), ...clean });
    },
    getConfig() {
        return { ...this.defaults, ...(StorageManager.get(this.KEY_CONFIG) || {}) };
    },

    // ----- low-level API helper -----
    async api(pathName, opts = {}) {
        const token = this.getToken();
        if (!token) throw new Error('No GitHub token set. Add one in Settings → Ollama.');
        return fetch('https://api.github.com' + pathName, {
            ...opts,
            headers: {
                'Accept': 'application/vnd.github+json',
                'Authorization': 'Bearer ' + token,
                'X-GitHub-Api-Version': '2022-11-28',
                ...(opts.headers || {})
            }
        });
    },

    _hint(status) {
        if (status === 401) return 'Your GitHub token is missing, expired, or invalid.';
        if (status === 403) return 'Token lacks permission (needs Actions + Contents read/write on this repo).';
        if (status === 404) return 'Workflow or repo not found — make sure ollama-resume.yml is pushed and the owner/repo are correct in Settings.';
        if (status === 422) return 'Invalid inputs, or the workflow has no workflow_dispatch trigger on the target branch yet.';
        return '';
    },

    // ----- trigger a run -----
    async dispatch({ resumeData, jobDescription, model }) {
        const cfg = this.getConfig();
        const runId = 'run-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
        const res = await this.api(`/repos/${cfg.owner}/${cfg.repo}/actions/workflows/${encodeURIComponent(cfg.workflow)}/dispatches`, {
            method: 'POST',
            body: JSON.stringify({
                ref: cfg.ref,
                inputs: {
                    run_id: runId,
                    // workflow_dispatch inputs share a ~64KB budget; keep them lean
                    resume_data: String(resumeData || '').slice(0, 28000),
                    job_description: String(jobDescription || '').slice(0, 6000),
                    model: model || cfg.model
                }
            })
        });
        if (!res.ok) {
            const txt = await res.text().catch(() => '');
            throw new Error(`Could not start the cloud job (HTTP ${res.status}). ${this._hint(res.status)} ${txt.slice(0, 200)}`.trim());
        }
        return { runId };
    },

    // ----- locate the run we just triggered (dispatch returns no id) -----
    // GitHub's run-list endpoint is eventually consistent and browsers/CDNs
    // cache it, so we add a cache-buster + no-cache header and poll generously.
    async findRun(runId, attempts = 40) {
        const cfg = this.getConfig();
        for (let i = 0; i < attempts; i++) {
            try {
                const res = await this.api(`/repos/${cfg.owner}/${cfg.repo}/actions/runs?event=workflow_dispatch&per_page=20&t=${Date.now()}`, {
                    headers: { 'Cache-Control': 'no-cache', 'If-None-Match': '' }
                });
                if (res.ok) {
                    const data = await res.json();
                    const run = (data.workflow_runs || []).find(r =>
                        (r.name && r.name.includes(runId)) ||
                        (r.display_title && r.display_title.includes(runId))
                    );
                    if (run) return run;
                }
            } catch (_) {
                // Transient network error (offline blip, Tracking Prevention,
                // rate-limit reset) — do NOT abort; the run is likely fine.
            }
            await this._sleep(3000);
        }
        throw new Error('The cloud job was started but is not showing in the run list yet (GitHub can lag ~1–2 min). It is almost certainly still running — open the Actions tab to watch it, then click Generate again to re-attach once it appears.');
    },

    // Convenient link to the repo's Actions tab for this workflow.
    actionsUrl() {
        const cfg = this.getConfig();
        return `https://github.com/${cfg.owner}/${cfg.repo}/actions/workflows/${encodeURIComponent(cfg.workflow)}`;
    },

    // ----- poll until the run completes -----
    async waitForCompletion(runId, onProgress) {
        const cfg = this.getConfig();
        const started = Date.now();
        const run = await this.findRun(runId);
        if (onProgress) onProgress(run.status || 'queued', run, 0);
        let last = run.status;
        for (let i = 0; i < 220; i++) { // ~11 min at 3s
            let r = null;
            try {
                const res = await this.api(`/repos/${cfg.owner}/${cfg.repo}/actions/runs/${run.id}?t=${Date.now()}`, {
                    headers: { 'Cache-Control': 'no-cache' }
                });
                if (res.ok) r = await res.json();
            } catch (_) {
                // Transient network error — keep polling, the run is still going.
            }
            if (r) {
                const elapsed = Math.round((Date.now() - started) / 1000);
                const changed = r.status !== last;
                if (changed) last = r.status;
                // Heartbeat: report on every status change AND roughly every ~21s
                // so the UI keeps saying "still working" instead of looking stuck.
                if (onProgress && (changed || i % 7 === 0)) onProgress(r.status, r, elapsed);
                if (r.status === 'completed') {
                    if (r.conclusion === 'success') return r;
                    throw new Error('Cloud job finished as "' + (r.conclusion || 'failure') + '". See the Actions logs.');
                }
            }
            await this._sleep(3000);
        }
        throw new Error('The cloud job is taking longer than usual. It is still running on GitHub — check the Actions tab; your result will be committed there when it finishes.');
    },

    // ----- one-shot background check: is the run done, and if so fetch result? -----
    // Returns { state: 'pending' | 'success' | 'failed', data?, conclusion? }.
    // Never throws — designed for a quiet background reconciler.
    async checkAndFetch(runId) {
        const cfg = this.getConfig();
        let run;
        try { run = await this.findRun(runId, 2); } catch (_) { return { state: 'pending' }; }
        try {
            const res = await this.api(`/repos/${cfg.owner}/${cfg.repo}/actions/runs/${run.id}?t=${Date.now()}`, {
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (res.ok) {
                const r = await res.json();
                if (r.status === 'completed') {
                    if (r.conclusion === 'success') {
                        try {
                            const data = await this.fetchResult(runId);
                            return { state: 'success', data };
                        } catch (_) {
                            return { state: 'success', data: null };
                        }
                    }
                    return { state: 'failed', conclusion: r.conclusion };
                }
            }
        } catch (_) { /* transient */ }
        return { state: 'pending' };
    },

    // ----- read the committed result file -----
    async fetchResult(runId) {
        const cfg = this.getConfig();
        const filePath = `generated/${runId}.json`;
        for (let i = 0; i < 12; i++) {
            try {
                const res = await this.api(`/repos/${cfg.owner}/${cfg.repo}/contents/${filePath}?ref=${cfg.ref}&t=${Date.now()}`, {
                    headers: { 'Cache-Control': 'no-cache' }
                });
                if (res.ok) {
                    const data = await res.json();
                    const b64 = String(data.content || '').replace(/\n/g, '');
                    let txt;
                    try { txt = decodeURIComponent(escape(atob(b64))); }
                    catch (_) { txt = atob(b64); }
                    return JSON.parse(txt);
                }
            } catch (_) {
                // Transient network error — retry below.
            }
            await this._sleep(2500);
        }
        throw new Error('Cloud job finished but the generated file was not found yet. Try again in a moment.');
    },

    _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
};

window.GitHubRunner = GitHubRunner;
