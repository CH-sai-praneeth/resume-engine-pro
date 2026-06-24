# Free Resume Tailoring with Ollama (Llama 3) on GitHub Codespaces

Run a **free**, private Llama 3 model to tailor your resume to a job description — no API keys, no cost. You can use it two ways:

1. **In the web app** — pick **Ollama / Llama 3** in the Generate tab (configure the endpoint in Settings).
2. **From the command line** — run `scripts/ollama-generate.js` to batch-generate tailored resumes.

Because GitHub Codespaces gives you free monthly hours and the environment is **deleted** when you stop it, you pay nothing.

---

## Procedure

### 1. Launch a Codespace
From your repository on GitHub: **Code ▸ Codespaces ▸ Create codespace on master**.

### 2. Install & run Ollama
In the Codespace terminal:

```bash
curl -fsSL https://ollama.com/install.sh | sh
# Allow the browser app to reach the server, then start it in the background:
OLLAMA_ORIGINS='*' ollama serve > ollama.log 2>&1 &
```

### 3. Pull the model
```bash
ollama pull llama3
```

### 4a. Generate from the command line
Put your existing resume(s) and the job description in text files, then:

```bash
node scripts/ollama-generate.js \
  --resume my-resume.txt \
  --resume older-resume.txt \
  --jd job-description.txt \
  --out output/tailored-resume.json \
  --model llama3
```

This writes a tailored `tailored-resume.json` and a readable `tailored-resume.md`.
Pass multiple `--resume` files to give the model more data points to curate from.

Commit the results if you want them in your repo:

```bash
git add output/ && git commit -m "Add tailored resume" && git push
```

### 4b. Or use it from the web app
1. In the Codespace, forward **port 11434** and set its visibility to **Public**
   (PORTS tab ▸ right-click 11434 ▸ Port Visibility ▸ Public).
2. Copy the forwarded URL and add `/v1/chat/completions` to the end.
3. In the app: **Settings ▸ Ollama / Llama 3**, paste that URL as the endpoint, model `llama3`, **Save**.
4. On the **Generate** tab, choose **Ollama / Llama 3** and generate as usual.

> Running Ollama on your **own machine** instead? Skip Codespaces: install Ollama,
> run `OLLAMA_ORIGINS='*' ollama serve`, and the app's default
> `http://localhost:11434/v1/chat/completions` endpoint works out of the box.

### 5. Delete the node (stop being billed)
In your **GitHub Codespaces dashboard**, click **Stop** (or **Delete**) on the Codespace.
The environment is wiped from the cloud and your free-hour usage stops.

---

## Notes
- `OLLAMA_ORIGINS='*'` is required so the browser app (a different origin) can call the server. For tighter security, set it to your exact site origin instead of `*`.
- Larger models (`llama3:70b`) give better results but need more RAM/time; `llama3` (8B) is a good free default.
- All processing is local to your Codespace/machine — your resume data never leaves it.
