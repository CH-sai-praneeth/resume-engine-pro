#!/usr/bin/env node
/**
 * ollama-generate.js
 * ------------------------------------------------------------------
 * Generate an ATS-optimized, tailored resume from one or more existing
 * resumes + a job description, using a FREE local Llama 3 model served
 * by Ollama. Designed to run inside a GitHub Codespace (or any machine
 * with Ollama installed) so you never pay for an API.
 *
 * USAGE
 *   node scripts/ollama-generate.js \
 *     --resume path/to/resume.txt \           (repeatable; .txt/.md)
 *     --jd path/to/job-description.txt \
 *     --out output/tailored-resume.json \
 *     --model llama3 \
 *     --endpoint http://localhost:11434
 *
 * Multiple --resume flags can be passed; their text is combined so the
 * model has the richest possible set of data points (experiences,
 * achievements, skills) to curate from.
 *
 * See OLLAMA-SETUP.md for the full Codespaces procedure.
 * ------------------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
    const args = { resume: [], jd: '', out: 'tailored-resume.json', model: 'llama3', endpoint: 'http://localhost:11434' };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        const next = () => argv[++i];
        if (a === '--resume') args.resume.push(next());
        else if (a === '--jd') args.jd = next();
        else if (a === '--out') args.out = next();
        else if (a === '--model') args.model = next();
        else if (a === '--endpoint') args.endpoint = next();
        else if (a === '--help' || a === '-h') { printHelp(); process.exit(0); }
    }
    return args;
}

function printHelp() {
    console.log(`
ollama-generate.js — tailor a resume to a JD with a free local Llama 3

  --resume <file>    Path to an existing resume (.txt/.md). Repeatable.
  --jd <file>        Path to the target job description (.txt/.md).
  --out <file>       Where to write the tailored JSON (default tailored-resume.json).
  --model <name>     Ollama model name (default llama3).
  --endpoint <url>   Ollama base URL (default http://localhost:11434).
`);
}

function readFileSafe(p) {
    try {
        return fs.readFileSync(p, 'utf8');
    } catch (e) {
        console.error(`Could not read file: ${p} (${e.message})`);
        process.exit(1);
    }
}

function buildPrompt(resumeText, jdText) {
    return `You are a world-class resume writer and ATS (Applicant Tracking System) optimization specialist.

GOAL: Produce a NEW, polished, ATS-optimized resume for the candidate, targeted at the JOB DESCRIPTION below. Actively rewrite — do not echo the input.

RULES:
- Mirror the exact terminology, hard skills, tools and keywords from the job description, but only where the candidate genuinely has that experience.
- Rewrite the summary into 3-4 punchy sentences positioning the candidate for THIS role.
- Rewrite each experience bullet: strong action verb first, quantified impact where supported, aligned to the job's responsibilities.
- Prioritize and reorder skills so the most JD-relevant come first.
- Stay truthful: use only the candidate's real employers, titles, dates and accomplishments. Never fabricate.

CANDIDATE RESUME(S) (authoritative source — extract every useful data point):
"""
${resumeText}
"""

TARGET JOB DESCRIPTION:
"""
${jdText}
"""

Respond with ONE valid minified JSON object and NOTHING else. Use EXACTLY these keys:
{"summary":"3-4 sentence ATS-optimized summary, plain text, no line breaks","skills":["12-20 prioritized JD-aligned skills"],"experience":[{"role":"job title","company":"employer","location":"city, ST","dates":"Mon YYYY - Mon YYYY","details":["rewritten achievement bullet, action-verb first, quantified, under 28 words"]}],"education":["degree, institution, year"]}
Return ONLY the JSON object.`;
}

async function callOllama(endpoint, model, prompt) {
    const url = endpoint.replace(/\/+$/, '') + '/v1/chat/completions';
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            temperature: 0.4,
            stream: false,
            messages: [
                { role: 'system', content: 'You are an expert resume writer and ATS specialist. Respond with ONLY a single valid minified JSON object — no markdown, no code fences.' },
                { role: 'user', content: prompt }
            ]
        })
    });
    if (!res.ok) {
        throw new Error(`Ollama HTTP ${res.status} — is the server running? Try: ollama serve`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content
        ?? data?.message?.content
        ?? (typeof data === 'string' ? data : JSON.stringify(data));
}

function extractJson(raw) {
    let s = String(raw).replace(/```[a-zA-Z]*\s*/g, '').replace(/```/g, '').trim();
    const a = s.indexOf('{');
    const b = s.lastIndexOf('}');
    const candidate = (a !== -1 && b > a) ? s.slice(a, b + 1) : s;
    try {
        return JSON.parse(candidate);
    } catch (e) {
        console.error('Model did not return valid JSON. Raw output saved alongside the output file.');
        return { _raw: raw };
    }
}

function toMarkdown(r) {
    const lines = [];
    if (r.summary) lines.push('## Summary', '', r.summary, '');
    if (Array.isArray(r.skills) && r.skills.length) lines.push('## Skills', '', r.skills.join(' • '), '');
    if (Array.isArray(r.experience) && r.experience.length) {
        lines.push('## Experience', '');
        r.experience.forEach(e => {
            const head = [e.role, e.company, e.location, e.dates].filter(Boolean).join(' | ');
            lines.push(`### ${head}`);
            (e.details || []).forEach(d => lines.push(`- ${d}`));
            lines.push('');
        });
    }
    if (Array.isArray(r.education) && r.education.length) {
        lines.push('## Education', '', ...r.education.map(e => `- ${e}`), '');
    }
    return lines.join('\n');
}

async function main() {
    const args = parseArgs(process.argv);
    if (!args.resume.length || !args.jd) {
        printHelp();
        console.error('Error: at least one --resume and one --jd are required.');
        process.exit(1);
    }
    const resumeText = args.resume.map((p, i) => `--- RESUME ${i + 1}: ${path.basename(p)} ---\n${readFileSafe(p)}`).join('\n\n');
    const jdText = readFileSafe(args.jd);

    console.log(`Tailoring resume with Ollama model "${args.model}" at ${args.endpoint} ...`);
    const raw = await callOllama(args.endpoint, args.model, buildPrompt(resumeText, jdText));
    const result = extractJson(raw);

    const outDir = path.dirname(args.out);
    if (outDir && !fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(args.out, JSON.stringify(result, null, 2), 'utf8');

    const mdPath = args.out.replace(/\.json$/i, '') + '.md';
    fs.writeFileSync(mdPath, toMarkdown(result), 'utf8');

    console.log(`Done. Wrote:\n  ${args.out}\n  ${mdPath}`);
}

main().catch(err => {
    console.error('Generation failed:', err.message);
    process.exit(1);
});
