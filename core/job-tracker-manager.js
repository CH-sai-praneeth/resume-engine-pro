// ============================================================================
// JOB TRACKER MANAGER - Job application & networking contact management
// ============================================================================
const JobTrackerManager = {
    APP_KEY: 'resumeEngineProV1_applications',
    CONTACT_KEY: 'resumeEngineProV1_contacts',
    META_KEY: 'resumeEngineProV1_tracker_meta',
    
    // Default applications: intentionally EMPTY so visitors to the public app
    // start with a blank Job Application Tracker (these used to seed every
    // visitor with the owner's real applications). Users add their own rows.
    defaultApps: [],
    
    genericResumes: [],
    
    // ========================================================================
    // LOAD & SAVE
    // ========================================================================
    
    loadApplications() {
        const stored = StorageManager.get('applications', false);
        if (!stored) {
            const apps = [...this.defaultApps];
            this.saveApplications(apps);
            return apps;
        }

        // One-time purge: anyone who loaded an earlier build had the owner's six
        // sample applications saved into their browser. Strip those legacy seed
        // rows once so they no longer appear for visitors (or the owner).
        let working = stored;
        if (!StorageManager.get('seedAppsCleared', false)) {
            working = stored.filter(a => !this._isLegacySeed(a));
            StorageManager.set('seedAppsCleared', true);
        }

        // Merge new default apps with stored ones (defaultApps is now empty)
        const byPortfolio = new Map(working.map(a => [a.portfolio, a]));
        this.defaultApps.forEach(d => {
            const existing = byPortfolio.get(d.portfolio);
            if (!existing) {
                working.push(d);
            } else if (!existing.repo && d.repo) {
                // Backfill repo link onto previously stored default entries
                existing.repo = d.repo;
            }
        });

        // Collapse rows that point at the same package (same repo, or same live
        // link). Re-publishing the same entry on the old build created identical
        // duplicate rows; this cleans them up the next time the tracker loads.
        const deduped = this.dedupeByRepo(working);
        this.saveApplications(deduped);
        return deduped;
    },

    // Identify the legacy sample applications that used to ship as defaults, so
    // they can be purged once from browsers that loaded an earlier build.
    _isLegacySeed(a) {
        if (!a) return false;
        const port = String(a.portfolio || '');
        const repo = String(a.repo || '');
        const seeds = ['RD-Profile', 'Senior-Incident-Manager', 'Staff-Escalation-Manager', 'Technical-Lead-Deployment-Operations', 'Manager-Cloud-Support', 'Senior-Manager-SRE'];
        return seeds.some(s => port === s || repo === 'https://github.com/rdammala/' + s);
    },

    // Keep the first occurrence of each repo/live-link; drop later duplicates.
    // Entries without a repo or link (manual one-offs) are always kept.
    dedupeByRepo(apps) {
        const seen = new Set();
        const out = [];
        (apps || []).forEach(a => {
            const key = (a && (a.repo || a.link)) || '';
            if (key && seen.has(key)) return;
            if (key) seen.add(key);
            out.push(a);
        });
        return out;
    },
    
    saveApplications(apps) {
        StorageManager.set('applications', apps);
        this.markLastUpdated();
    },
    
    loadContacts() {
        return StorageManager.get('contacts', false) || [];
    },
    
    saveContacts(contacts) {
        StorageManager.set('contacts', contacts);
        this.markLastUpdated();
    },
    
    // ========================================================================
    // APPLICATION OPERATIONS
    // ========================================================================
    
    addApplication(app) {
        const apps = this.loadApplications();
        app.id = apps.length ? Math.max(...apps.map(a => a.id)) + 1 : 1;
        // Newest first so a freshly published application is visible at the top
        // of the list instead of being buried at the bottom.
        apps.unshift(app);
        this.saveApplications(apps);
        return app;
    },

    // Add or refresh an application keyed by its GitHub repo URL. Used by the
    // Publish flow so re-publishing the same entry updates the existing row
    // (link/date/status) instead of creating a duplicate.
    upsertApplicationByRepo(app) {
        const apps = this.loadApplications();
        const idx = app.repo ? apps.findIndex(a => a.repo && a.repo === app.repo) : -1;
        if (idx !== -1) {
            apps[idx] = { ...apps[idx], ...app, id: apps[idx].id };
            this.saveApplications(apps);
            return apps[idx];
        }
        app.id = apps.length ? Math.max(...apps.map(a => a.id)) + 1 : 1;
        apps.unshift(app);
        this.saveApplications(apps);
        return app;
    },
    
    updateApplication(id, updates) {
        const apps = this.loadApplications();
        const index = apps.findIndex(a => a.id === id);
        if (index !== -1) {
            apps[index] = { ...apps[index], ...updates };
            this.saveApplications(apps);
            return apps[index];
        }
        return null;
    },
    
    deleteApplication(id) {
        const apps = this.loadApplications();
        const filtered = apps.filter(a => a.id !== id);
        this.saveApplications(filtered);
        return true;
    },
    
    getApplications() {
        return this.loadApplications();
    },
    
    // ========================================================================
    // CONTACT OPERATIONS
    // ========================================================================
    
    addContact(contact) {
        const contacts = this.loadContacts();
        contact.id = contacts.length ? Math.max(...contacts.map(c => c.id)) + 1 : 1;
        contact.created = new Date().toISOString().split('T')[0];
        contacts.push(contact);
        this.saveContacts(contacts);
        return contact;
    },
    
    updateContact(id, updates) {
        const contacts = this.loadContacts();
        const index = contacts.findIndex(c => c.id === id);
        if (index !== -1) {
            contacts[index] = { ...contacts[index], ...updates };
            this.saveContacts(contacts);
            return contacts[index];
        }
        return null;
    },
    
    deleteContact(id) {
        const contacts = this.loadContacts();
        const filtered = contacts.filter(c => c.id !== id);
        this.saveContacts(filtered);
        return true;
    },
    
    getContacts() {
        return this.loadContacts();
    },
    
    // ========================================================================
    // SEARCH & FILTER
    // ========================================================================
    
    searchApplications(query) {
        const apps = this.loadApplications();
        const q = query.toLowerCase();
        return apps.filter(a => {
            const searchFields = [a.portfolio, a.role, a.company, a.comments].map(f => (f || '').toLowerCase());
            return searchFields.some(f => f.includes(q));
        });
    },
    
    filterApplicationsByStatus(status) {
        const apps = this.loadApplications();
        if (!status) return apps;
        return apps.filter(a => a.status === status);
    },
    
    searchContacts(query) {
        const contacts = this.loadContacts();
        const q = query.toLowerCase();
        return contacts.filter(c => {
            const searchFields = [c.name, c.company, c.email, c.comments, c.source].map(f => (f || '').toLowerCase());
            return searchFields.some(f => f.includes(q));
        });
    },
    
    // ========================================================================
    // STATISTICS
    // ========================================================================
    
    getStats() {
        const apps = this.loadApplications();
        return {
            total: apps.length,
            applied: apps.filter(a => a.status === 'Applied').length,
            interviewing: apps.filter(a => a.status === 'Interviewing').length,
            offered: apps.filter(a => a.status === 'Offered').length,
            rejected: apps.filter(a => ['Rejected', 'Denied'].includes(a.status)).length,
            contacts: this.loadContacts().length
        };
    },
    
    // ========================================================================
    // PORTFOLIO GUIDE
    // ========================================================================
    
    getPortfolioGuide() {
        const apps = this.loadApplications();
        const portfolioMap = new Map();
        
        apps.forEach(app => {
            if (!portfolioMap.has(app.portfolio)) {
                portfolioMap.set(app.portfolio, {
                    name: app.portfolio,
                    url: app.link,
                    count: 0
                });
            }
            portfolioMap.get(app.portfolio).count++;
        });
        
        return Array.from(portfolioMap.values()).sort((a, b) => b.count - a.count);
    },
    
    // ========================================================================
    // EXPORT & IMPORT
    // ========================================================================
    
    export() {
        const data = {
            applications: this.loadApplications(),
            contacts: this.loadContacts(),
            exportedAt: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    },
    
    import(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.applications) {
                this.saveApplications(data.applications);
            }
            if (data.contacts) {
                this.saveContacts(data.contacts);
            }
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // ========================================================================
    // SYNC WITH GITHUB
    // ========================================================================
    
    async syncToGitHub(repoName) {
        if (!GitHubManager.isAuthenticated()) {
            return { success: false, error: 'Not authenticated' };
        }
        
        try {
            const appsBlob = JSON.stringify(this.loadApplications(), null, 2);
            const contactsBlob = JSON.stringify(this.loadContacts(), null, 2);
            
            await GitHubManager.pushFile(
                repoName,
                'applications.json',
                appsBlob,
                'Sync applications to GitHub'
            );
            
            await GitHubManager.pushFile(
                repoName,
                'contacts.json',
                contactsBlob,
                'Sync contacts to GitHub'
            );
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // ========================================================================
    // UTILITY
    // ========================================================================
    
    extractGitHubRepoUrl(portfolioLink) {
        if (!portfolioLink) return null;
        const match = portfolioLink.match(/github\.io\/([^\/]+)/);
        return match && match[1] ? `https://github.com/rdammala/${match[1]}` : null;
    },
    
    markLastUpdated() {
        const meta = { lastUpdatedMs: Date.now() };
        StorageManager.set('trackerMeta', meta);
    },
    
    getLastUpdated() {
        const meta = StorageManager.get('trackerMeta', false) || {};
        if (!meta.lastUpdatedMs) return null;
        
        const dt = new Date(meta.lastUpdatedMs);
        return new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(dt);
    }
};

window.JobTrackerManager = JobTrackerManager;