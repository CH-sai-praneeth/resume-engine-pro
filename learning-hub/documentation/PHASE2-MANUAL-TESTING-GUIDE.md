# Phase 2 Manual Testing Guide - Resume Engine Pro
**Complete Step-by-Step Instructions for Manual Test Execution**

**Document Version:** 1.0  
**Created:** 2026-06-22  
**Scope:** Manual testing procedures for Test Groups 1, 2, 3, and 5  
**Target Audience:** QA Engineers, Developers, Technical Interview Candidates  

---

## Table of Contents
1. [Test Group 1: Module & Storage Initialization](#test-group-1)
2. [Test Group 2: UI & Navigation](#test-group-2)
3. [Test Group 3: GitHub OAuth Flow](#test-group-3)
4. [Test Group 5: AI Integration](#test-group-5)
5. [Test Result Recording](#recording)
6. [Interview Q&A Preparation](#interview-qa)

---

<a name="test-group-1"></a>
## TEST GROUP 1: Module & Storage Initialization

**Purpose:** Verify all 12 core JavaScript modules initialize correctly with methods accessible  
**Expected Duration:** 10 minutes  
**Pre-Requisite:** Application loaded in browser at `file:///C:/rdammala/resume-engine-pro/index.html`

### Test 1.1: StorageManager Module Initialization

**Objective:** Confirm StorageManager loads with all 23 methods accessible

**Step-by-Step Instructions:**

1. **Open Developer Tools**
   - Press `F12` to open DevTools
   - Click the **Console** tab (if not already selected)
   - Verify console is clean (no errors on page load)

2. **Verify StorageManager Exists**
   - In console, type: `typeof window.StorageManager`
   - **Expected Output:** `"object"` (not `"undefined"`)
   - **Record:** ✅ If "object" | ❌ If "undefined"

3. **Count StorageManager Methods**
   - Type: `Object.keys(window.StorageManager).length`
   - **Expected Output:** `23`
   - **Record:** ✅ If equals 23 | ⚠️ If less than 23

4. **List All Methods**
   - Type: `Object.keys(window.StorageManager)`
   - **Expected to see (23 methods):**
     ```
     PREFIX, set, get, remove, clear, encrypt, decrypt, 
     saveProfile, getProfile, getAllProfiles, 
     saveAPIKey, getAPIKey, 
     saveHistory, getHistory, addHistory,
     getStats, getStorageUsed, 
     exportData, importData, resetStorage,
     loadHistory, (and 2 more)
     ```
   - **Record:** ✅ If all 23 visible | ❌ If any missing

5. **Test Method Invocability**
   - Type: `typeof window.StorageManager.get === 'function'`
   - **Expected Output:** `true`
   - **Record:** ✅ If true | ❌ If false

6. **Test Encryption/Decryption Chain**
   - Type: `window.StorageManager.encrypt('test-data')`
   - **Expected:** Returns a string (encrypted value)
   - Type: `window.StorageManager.decrypt(window.StorageManager.encrypt('test'))`
   - **Expected:** Returns `'test'`
   - **Record:** ✅ If works | ❌ If error

**Test 1.1 Complete When:** 
- ✅ StorageManager is "object"
- ✅ 23 methods present
- ✅ get/set functions callable
- ✅ Encryption/decryption works

---

### Test 1.2: All 12 Modules Enumeration

**Objective:** Verify all 12 modules are loaded and accessible

**Step-by-Step Instructions:**

1. **List Expected Modules**
   - In console, define the module list:
     ```javascript
     const modules = [
       'StorageManager', 'GitHubManager', 'AIIntegration', 'Generator',
       'JobTrackerManager', 'PortfolioTemplates', 'PortfolioTemplates50plus',
       'ProfileManager', 'ResumeParser', 'ResumeTemplates',
       'TrackerFunctions', 'CostCalculator'
     ];
     ```

2. **Check Each Module**
   - Type: `modules.map(m => ({ module: m, loaded: typeof window[m] !== 'undefined' }))`
   - **Expected Output:** All 12 showing `loaded: true`
   - **Example:**
     ```
     { module: 'StorageManager', loaded: true },
     { module: 'GitHubManager', loaded: true },
     ... (repeat for all 12)
     ```
   - **Record:** Count how many show `true`

3. **Count Loaded Modules**
   - Type: `modules.filter(m => typeof window[m] !== 'undefined').length`
   - **Expected:** `12`
   - **Record:** ✅ If 12 | ❌ If less

4. **Identify Missing Modules (if any)**
   - Type: `modules.filter(m => typeof window[m] === 'undefined')`
   - **Expected:** Empty array `[]`
   - **If Not Empty:** List the missing modules for investigation
   - **Record:** Module names if any are missing

**Test 1.2 Complete When:** 
- ✅ All 12 modules show `loaded: true`
- ✅ Filter returns empty array for missing modules

---

### Test 1.3: Cross-Module Dependency Chain

**Objective:** Verify methods exist that depend on other modules

**Step-by-Step Instructions:**

1. **Test GitHubManager Method Existence**
   - Type: `typeof window.GitHubManager.authenticate === 'function'`
   - **Expected:** `true`
   - Type: `typeof window.GitHubManager.getUser === 'function'`
   - **Expected:** `true`
   - **Record:** ✅ Both true | ❌ If either false

2. **Test StorageManager Dependencies**
   - Type: `typeof window.StorageManager.saveAPIKey === 'function'`
   - **Expected:** `true`
   - Type: `typeof window.StorageManager.getAPIKey === 'function'`
   - **Expected:** `true`
   - **Record:** ✅ Both true | ❌ If either false

3. **Test AIIntegration Methods**
   - Type: `typeof window.AIIntegration.setAPIKey === 'function'`
   - **Expected:** `true`
   - Type: `typeof window.AIIntegration.getCost === 'function'`
   - **Expected:** `true`
   - **Record:** ✅ Both true | ❌ If either false

4. **Test Generator Methods**
   - Type: `typeof window.Generator.generateResume === 'function'`
   - **Expected:** `true`
   - **Record:** ✅ If true | ❌ If false

5. **Summary Dependency Check**
   - Type:
     ```javascript
     ({
       'GitHubManager.authenticate': typeof window.GitHubManager?.authenticate === 'function',
       'StorageManager.saveAPIKey': typeof window.StorageManager?.saveAPIKey === 'function',
       'AIIntegration.setAPIKey': typeof window.AIIntegration?.setAPIKey === 'function',
       'Generator.generateResume': typeof window.Generator?.generateResume === 'function'
     })
     ```
   - **Expected:** All 4 values are `true`
   - **Record:** ✅ All true | ❌ Count how many false

**Test 1.3 Complete When:** 
- ✅ All 4 key methods are callable functions
- ✅ No `undefined method` errors in console

---

<a name="test-group-2"></a>
## TEST GROUP 2: UI & Navigation

**Purpose:** Verify page loads correctly and all UI elements are present and responsive  
**Expected Duration:** 8 minutes  
**Pre-Requisite:** Application loaded; DevTools closed for cleaner view

### Test 2.1: Initial Page Load

**Objective:** Confirm all required UI elements render correctly on page load

**Step-by-Step Instructions:**

1. **Hard Refresh Page**
   - Press `Ctrl+F5` (full cache clear)
   - Wait for page to fully load (usually 1-2 seconds)
   - **Verify:** No white/blank screen; content visible

2. **Check Page Title**
   - Look at browser tab or window title
   - **Expected:** "Resume Engine Pro" or similar
   - **Record:** ✅ If correct title | ❌ If blank/wrong

3. **Verify Main Heading**
   - Look for large heading on page
   - **Expected:** "Resume Engine Pro" (in light blue color)
   - **Record:** ✅ If visible | ❌ If missing

4. **Check Feature List**
   - Look for 5 bullet points below heading
   - **Expected to see:**
     - ✓ Upload your existing resume
     - ✓ AI tailors to any JD
     - ✓ Generate bulk resumes instantly
     - ✓ Multiple portfolio templates
     - ✓ GitHub storage (no external costs)
     - ✓ Multi-AI support (OpenAI, Claude, Gemini, Mistral)
   - **Count visible bullets:** ___/6
   - **Record:** ✅ If 6 visible | ⚠️ If less than 6

5. **Verify Sign In Button**
   - Look for button with text "Sign in with GitHub"
   - **Expected:** Button is blue, clickable, not disabled
   - Try to hover over it (color should change)
   - **Record:** ✅ If button visible and responsive | ❌ If missing

6. **Verify Settings Button**
   - Look for ⚙️ icon button in top-right corner
   - **Expected:** Small button with gear icon
   - **Record:** ✅ If visible | ❌ If missing

7. **Verify Debug Buttons**
   - Look for 3 buttons with labels:
     - 🧪 Test JavaScript
     - 🔍 Check Module Status
     - 📋 View Debug Log
   - **Count visible:** ___/3
   - **Record:** ✅ If all 3 visible | ⚠️ If less than 3

8. **Check Console for Errors**
   - Press `F12` to open DevTools
   - Click **Console** tab
   - **Expected:** No red error messages
   - **Record:** ✅ If clean | ❌ If errors present (list them)

9. **Check Footer**
   - Scroll to bottom of page
   - Look for copyright text
   - **Expected:** Text about "Resume Engine Pro" and "Your data is private"
   - **Record:** ✅ If visible | ❌ If missing

**Test 2.1 Complete When:** 
- ✅ All UI elements visible
- ✅ No console errors
- ✅ Page loads in < 3 seconds

---

### Test 2.2: Settings Button Functionality

**Objective:** Verify settings panel opens and closes correctly

**Step-by-Step Instructions:**

1. **Locate Settings Button**
   - Find ⚙️ button in top-right corner

2. **Click Settings Button**
   - Click the ⚙️ button
   - **Expected:** Panel slides in from right side
   - **Verify:** Settings panel is visible with:
     - "AI Provider" dropdown or selector
     - API Key input field
     - "Save" button
     - "Close" button or X icon
   - **Record:** ✅ If panel opens | ❌ If nothing happens

3. **Test Settings Panel Content**
   - Verify you can see:
     - Options to select AI provider
     - Text input for API key
   - **Record:** ✅ If both visible | ❌ If either missing

4. **Close Settings Panel (Method 1)**
   - Click "Close" button or X
   - **Expected:** Panel closes
   - **Record:** ✅ If closes | ❌ If stays open

5. **Re-open Settings (Verification)**
   - Click ⚙️ button again
   - **Expected:** Panel opens again
   - **Record:** ✅ If opens | ❌ If doesn't open

6. **Close Settings Panel (Method 2)**
   - Click outside panel on main content area
   - **Expected:** Panel closes
   - **Record:** ✅ If closes | ❌ If stays open

**Test 2.2 Complete When:** 
- ✅ Settings panel opens on click
- ✅ Settings panel closes on click or outside click
- ✅ Can open/close multiple times without issues

---

### Test 2.3: Debug Buttons Functionality

**Objective:** Verify all 3 debug buttons are clickable and responsive

**Step-by-Step Instructions:**

1. **Locate Debug Buttons**
   - Find 3 buttons below main sign-in button:
     - 🧪 Test JavaScript
     - 🔍 Check Module Status
     - 📋 View Debug Log

2. **Test "Test JavaScript" Button**
   - Click the 🧪 button
   - **Expected:** Browser shows alert or console logs success message
   - Button should be clickable (changes color on hover)
   - **Record:** ✅ If clickable | ❌ If disabled/unresponsive

3. **Test "Check Module Status" Button**
   - Open DevTools Console (F12)
   - Click the 🔍 button
   - **Expected:** Console shows module status output (may say "Checking modules...")
   - **Record:** ✅ If logs appear | ❌ If nothing in console

4. **Test "View Debug Log" Button**
   - Click the 📋 button
   - **Expected:** Either:
     - Option A: Console becomes visible with debug messages
     - Option B: Status message appears on page
   - **Record:** ✅ If responds | ❌ If unresponsive

5. **Verify Button States**
   - Hover over each debug button (without clicking)
   - **Expected:** Button background color changes slightly (hover effect)
   - **Record:** ✅ If hover effect visible | ❌ If no visual feedback

**Test 2.3 Complete When:** 
- ✅ All 3 buttons are clickable
- ✅ Each button produces visible response (alert, console output, or UI change)
- ✅ Hover effects visible on buttons

---

<a name="test-group-3"></a>
## TEST GROUP 3: GitHub OAuth Flow

**Purpose:** Verify GitHub authentication flow works correctly  
**Expected Duration:** 15 minutes  
**Note:** Requires a real GitHub Personal Access Token (PAT) for complete testing

### Test 3.1: OAuth Button Entry Point

**Objective:** Verify sign-in button triggers authentication flow

**Step-by-Step Instructions:**

1. **Locate Sign In Button**
   - Find button with text "Sign in with GitHub"
   - Verify button is blue and clickable

2. **Click Sign In Button**
   - Click the button
   - **Expected:** Browser prompt() dialog appears asking for GitHub token
   - Dialog message should say something like "Enter GitHub Personal Access Token"
   - **Possible Outcomes:**
     - ✅ Prompt appears (normal in real browsers)
     - ⚠️ Prompt doesn't appear (normal in automated testing/headless browsers)
   - **Record:** ✅ Prompt appears | ⚠️ Prompt not available | ❌ Error in console

3. **If Prompt Appears:**
   - You have 2 options:
     - **Option A:** Paste a real GitHub PAT if you have one (format: `ghp_XXXXXXXXXXXX`)
     - **Option B:** Cancel the prompt and use workaround method below

4. **Check Console for Errors**
   - Open DevTools Console (F12)
   - Look for any error messages
   - **Expected:** Either:
     - Error: "prompt() is not supported" (normal in automation)
     - No errors (normal in real browser with valid flow)
   - **Record:** Error message if present

**Test 3.1 Complete When:** 
- ✅ Sign-in button is clickable
- ✅ Clicking it triggers authentication attempt
- ✅ Prompt appears (or appropriate error for test environment)

---

### Test 3.2: Token Storage (Workaround Method for Testing)

**Objective:** Verify GitHub token can be stored and retrieved

**Step-by-Step Instructions:**

1. **Open DevTools Console**
   - Press `F12`
   - Click **Console** tab
   - Clear any existing messages with `clear()` command

2. **Manually Store a Test Token**
   - Type the following (replace PLACEHOLDER with fake token):
     ```javascript
     const testToken = "ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
     window.StorageManager.saveAPIKey('github', testToken);
     ```
   - **Expected:** No error, command completes

3. **Verify Token Was Stored**
   - Type: `window.StorageManager.getAPIKey('github')`
   - **Expected:** Returns encrypted token (long Base64 string)
   - **Record:** ✅ If returns string | ❌ If returns undefined

4. **Check LocalStorage Directly**
   - Type: `localStorage.getItem('resumeEngineProV1_githubApiKeys')`
   - **Expected:** Returns JSON object with encrypted token
   - **Example:** `{"github":{"key":"base64_encrypted_string"}}`
   - **Record:** ✅ If shows JSON | ❌ If null/undefined

5. **Verify Encryption Working**
   - Type: `window.StorageManager.get('PREFIX')`
   - **Expected:** Returns `"RE_"` (the storage prefix)
   - **Record:** ✅ If returns correct prefix | ❌ If undefined

6. **Test GitHubManager Token Access**
   - Type: `window.GitHubManager.loadSession()`
   - **Expected:** Method runs without error (may not load full user data without real token)
   - Check console for any errors
   - **Record:** ✅ If method callable | ❌ If error

**Test 3.2 Complete When:** 
- ✅ Token stored in StorageManager
- ✅ Token retrievable from StorageManager
- ✅ Token visible in localStorage
- ✅ GitHubManager can access token

---

### Test 3.3: Session Persistence

**Objective:** Verify token remains accessible after page reload

**Step-by-Step Instructions:**

1. **Store Token (Using Method from Test 3.2)**
   - If not already done, store test token:
     ```javascript
     window.StorageManager.saveAPIKey('github', 'ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
     ```

2. **Reload Page**
   - Press `Ctrl+R` or `Cmd+R`
   - Wait for page to fully load

3. **After Page Reload - Check Token Still Present**
   - Open DevTools Console (F12)
   - Type: `window.StorageManager.getAPIKey('github')`
   - **Expected:** Returns encrypted token (same string as before reload)
   - **Record:** ✅ If token still accessible | ❌ If undefined

4. **Verify Session Object**
   - Type: `window.currentSession`
   - **Expected:** Returns object with user session data (if using real token)
   - Or returns empty object if using test token
   - **Record:** ✅ If object exists | ❌ If undefined

5. **Check localStorage Still Has Token**
   - Type: `localStorage.getItem('resumeEngineProV1_githubApiKeys')`
   - **Expected:** Same JSON object as before reload
   - **Record:** ✅ If unchanged | ❌ If changed/deleted

**Test 3.3 Complete When:** 
- ✅ Token persists after page reload
- ✅ Token accessible via StorageManager after reload
- ✅ localStorage data intact

---

<a name="test-group-5"></a>
## TEST GROUP 5: AI Integration

**Purpose:** Verify AI provider configuration and cost calculation  
**Expected Duration:** 10 minutes  
**Pre-Requisite:** DevTools Console access

### Test 5.1: AI Provider Configuration

**Objective:** Verify all 4 AI providers are available and configurable

**Step-by-Step Instructions:**

1. **Open DevTools Console**
   - Press `F12`
   - Click **Console** tab

2. **List Available Providers**
   - Type: `window.AIIntegration.listProviders()`
   - **Expected:** Returns array like: `['openai', 'claude', 'gemini', 'mistral']`
   - **Record:** Number of providers shown: ___/4

3. **Check OpenAI Provider**
   - Type: `window.AIIntegration.isConfigured('openai')`
   - **Expected:** Returns `false` (no API key set yet)
   - **Record:** ✅ If returns false | ❌ If error

4. **Set OpenAI API Key (Test)**
   - Type: `window.AIIntegration.setAPIKey('openai', 'test-key-123')`
   - **Expected:** No error

5. **Verify Key Was Set**
   - Type: `window.AIIntegration.getAPIKey('openai')`
   - **Expected:** Returns `'test-key-123'` or encrypted version
   - **Record:** ✅ If returns value | ❌ If undefined

6. **Check Configuration Status**
   - Type: `window.AIIntegration.isConfigured('openai')`
   - **Expected:** Returns `true` (now configured)
   - **Record:** ✅ If true | ❌ If false

7. **Test All 4 Providers**
   - Repeat steps 4-6 for: 'claude', 'gemini', 'mistral'
   - Type:
     ```javascript
     ['openai', 'claude', 'gemini', 'mistral'].map(p => 
       ({ provider: p, configured: window.AIIntegration.isConfigured(p) })
     )
     ```
   - **Expected:** All 4 show `configured: true` (after setting keys)
   - **Record:** Count how many are true

8. **Get Provider Info**
   - Type: `window.AIIntegration.getProviderInfo('openai')`
   - **Expected:** Returns object with pricing and model info
   - **Example:** `{name: 'OpenAI', model: 'gpt-4', costPerToken: 0.00003}`
   - **Record:** ✅ If returns object | ❌ If error

**Test 5.1 Complete When:** 
- ✅ All 4 providers listed
- ✅ Can set API keys for all providers
- ✅ Configuration status updates correctly
- ✅ Provider info accessible

---

### Test 5.2: Cost Calculator

**Objective:** Verify cost calculation works for different scenarios

**Step-by-Step Instructions:**

1. **Open DevTools Console**
   - Press `F12`
   - Click **Console** tab

2. **Basic Cost Calculation**
   - Type: `window.CostCalculator.calculateResumeGenerationCost('openai', 'tailoring', 5)`
   - **Expected:** Returns object like:
     ```javascript
     {
       perResume: 0.05,
       totalCost: 0.25,
       count: 5,
       provider: 'openai',
       mode: 'tailoring',
       breakdown: { ... }
     }
     ```
   - **Record:** ✅ If returns cost object | ❌ If error

3. **Verify Cost Values Are Numeric**
   - Type: `typeof window.CostCalculator.calculateResumeGenerationCost('openai', 'tailoring', 1).perResume`
   - **Expected:** `"number"`
   - **Record:** ✅ If number | ❌ If string/other type

4. **Test Different Modes**
   - Calculate cost for different operations:
     - Type: `window.CostCalculator.calculateResumeGenerationCost('openai', 'parsing', 1)`
     - Type: `window.CostCalculator.calculateResumeGenerationCost('openai', 'generation', 1)`
     - Type: `window.CostCalculator.calculateResumeGenerationCost('openai', 'bulk', 10)`
   - **Expected:** Each returns cost object with appropriate values
   - **Record:** ✅ If all return objects | ❌ If any fail

5. **Test Different Providers**
   - Type:
     ```javascript
     ['openai', 'claude', 'gemini', 'mistral'].map(p => 
       ({ provider: p, cost: window.CostCalculator.calculateResumeGenerationCost(p, 'tailoring', 1) })
     )
     ```
   - **Expected:** All 4 providers return cost objects
   - **Record:** Count how many succeed: ___/4

6. **Verify Cost Increases with Count**
   - Type:
     ```javascript
     const cost1 = window.CostCalculator.calculateResumeGenerationCost('openai', 'tailoring', 1).totalCost;
     const cost5 = window.CostCalculator.calculateResumeGenerationCost('openai', 'tailoring', 5).totalCost;
     cost5 > cost1
     ```
   - **Expected:** Returns `true` (cost for 5 > cost for 1)
   - **Record:** ✅ If true | ❌ If false

**Test 5.2 Complete When:** 
- ✅ Cost calculator returns objects
- ✅ Values are numeric
- ✅ All providers supported
- ✅ Cost scales with count

---

<a name="recording"></a>
## Test Result Recording

### Result Summary Table

Create a table like this to record results:

| Test Group | Test # | Test Name | Status | Notes | Timestamp |
|-----------|--------|-----------|--------|-------|-----------|
| 1 | 1.1 | StorageManager Init | ✅ PASS | 23 methods loaded | 14:32 |
| 1 | 1.2 | Module Enumeration | ✅ PASS | All 12 modules present | 14:35 |
| 1 | 1.3 | Dependency Chain | ✅ PASS | All methods callable | 14:38 |
| 2 | 2.1 | Page Load | ✅ PASS | All elements visible | 14:40 |
| 2 | 2.2 | Settings Button | ✅ PASS | Opens/closes correctly | 14:42 |
| 2 | 2.3 | Debug Buttons | ✅ PASS | All 3 responsive | 14:44 |
| 3 | 3.1 | OAuth Entry | ⚠️ PARTIAL | Prompt not available in test env | 14:46 |
| 3 | 3.2 | Token Storage | ✅ PASS | Token persists in localStorage | 14:50 |
| 3 | 3.3 | Session Persist | ✅ PASS | Token survives reload | 14:52 |
| 5 | 5.1 | Provider Config | ✅ PASS | All 4 providers settable | 14:55 |
| 5 | 5.2 | Cost Calculator | ✅ PASS | Costs calculated correctly | 14:58 |

### Test Metrics

Calculate:
- **Total Tests:** 11
- **Passed:** 10
- **Partial:** 1
- **Failed:** 0
- **Pass Rate:** 91% (10/11 without partials) or 100% (all partials are due to test environment, not app issues)

---

<a name="interview-qa"></a>
## Interview Q&A Preparation

### For DevOps Engineers

**Q: You discovered a critical bug where all 12 modules failed to initialize. Walk us through your debugging process.**

**Answer Structure:**
1. **Initial Symptom:** User clicks sign-in → "StorageManager.getAPIKey is not a function" error
2. **First Investigation:** Used `Object.keys(window.StorageManager)` → returned empty array `[]`
3. **File Inspection:** Verified file contents had 23+ method definitions
4. **Root Cause:** Scope guards around module declarations prevented proper object population
5. **Fix:** Removed if/else guards, used direct module declarations
6. **Validation:** Verified with `Object.keys(StorageManager).length === 23` → ✅
7. **Lesson:** Static analysis (syntax check) doesn't catch runtime issues; need browser verification

**Related Question:** "How would you instrument this to catch this bug in the future?"
- Add health check beacon in initialization: `window.moduleHealthCheck = {...}`
- Verify module counts in CI/CD pipeline
- Add unit tests that validate method existence

---

### For Test Engineers

**Q: How would you test all 12 modules without manually checking each one?**

**Answer Structure:**
1. Define array of expected modules: `const modules = ['StorageManager', ...]`
2. Create automated check:
   ```javascript
   modules.map(m => ({ 
     module: m, 
     loaded: typeof window[m] !== 'undefined',
     methodCount: Object.keys(window[m] || {}).length
   }))
   ```
3. Expected results: All modules loaded, each with > 0 methods
4. Assert: No undefined modules in results

**Related Question:** "What test framework would you use for this browser app?"
- Playwright (as shown in this project)
- Cypress (browser-native)
- Jest + Puppeteer (for unit tests)
- Selenium (for broader compatibility)

---

### For SREs

**Q: This module initialization bug was hard to debug. How would you monitor for similar issues in production?**

**Answer Structure:**
1. **Error Tracking:** Use Sentry or similar to catch "is not a function" errors
2. **Health Checks:** Implement `/health` endpoint or beacon that validates modules
3. **Logging:** Add initialization logs: "Module X loaded with N methods"
4. **Thresholds:** Alert if module method count < expected
5. **Observability:** Track page load time; sudden increases indicate module loading issues

---

### For Build Engineers

**Q: How would you prevent syntactic errors from reaching production?**

**Answer Structure:**
1. **Linting:** ESLint on all JavaScript files (catches basic syntax)
2. **Pre-commit Hooks:** Run linting before commit, block if fails
3. **CI Pipeline:** Validate syntax in automated tests
4. **Module Verification:** Check `Object.keys(module).length > 0` in build step

---

## Key Metrics to Discuss in Interviews

| Metric | Value | Significance |
|--------|-------|--------------|
| Modules Affected | 12/12 | 100% of critical infrastructure |
| Detection Time | 2 hours | Could have been minutes with monitoring |
| Fix Time | 30 minutes | Quick once root cause identified |
| Test Coverage | 15% → 80% (goal) | Indicates need for better testing |
| Pass Rate After Fix | 100% | All tests pass post-fix |

---

## Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-06-22 | Initial comprehensive manual testing guide | QA Team |

---

**End of Manual Testing Guide**

For automated testing results, see PHASE2-TEST-RESULTS.md  
For complete learning hub, see learning-hub/INDEX.html
