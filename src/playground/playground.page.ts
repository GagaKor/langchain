export const PLAYGROUND_HTML = String.raw`<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RAG Playground</title>
    <style>
      :root {
        --bg: #f5efe4;
        --panel: rgba(255, 252, 246, 0.92);
        --panel-strong: #fff9ef;
        --line: rgba(62, 43, 31, 0.14);
        --text: #26180f;
        --muted: #6c5b4d;
        --accent: #bb5a2f;
        --accent-strong: #8f3410;
        --accent-soft: #f2d4b9;
        --success: #227a52;
        --danger: #b73629;
        --shadow: 0 24px 60px rgba(67, 42, 21, 0.14);
        --radius-lg: 28px;
        --radius-md: 18px;
        --radius-sm: 12px;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(255, 209, 168, 0.9), transparent 28%),
          radial-gradient(circle at right 20%, rgba(198, 103, 57, 0.18), transparent 24%),
          linear-gradient(135deg, #f7f0e4 0%, #f1e3d0 52%, #ead7bf 100%);
        font-family: Georgia, "Times New Roman", serif;
      }

      .shell {
        max-width: 1380px;
        margin: 0 auto;
        padding: 36px 20px 48px;
      }

      .hero {
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        gap: 18px;
        align-items: stretch;
        margin-bottom: 20px;
      }

      .hero-card,
      .hint-card,
      .panel,
      .console {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow);
        backdrop-filter: blur(10px);
      }

      .hero-card {
        padding: 30px;
        position: relative;
        overflow: hidden;
      }

      .hero-card::after {
        content: "";
        position: absolute;
        inset: auto -60px -80px auto;
        width: 220px;
        height: 220px;
        background: radial-gradient(circle, rgba(187, 90, 47, 0.18), transparent 68%);
        pointer-events: none;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 12px;
        border-radius: 999px;
        background: rgba(38, 24, 15, 0.06);
        color: var(--accent-strong);
        font-size: 13px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      h1 {
        margin: 18px 0 12px;
        font-size: clamp(32px, 5vw, 56px);
        line-height: 0.98;
      }

      .hero-copy {
        max-width: 58ch;
        color: var(--muted);
        font-size: 17px;
        line-height: 1.7;
      }

      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 22px;
      }

      .hint-card {
        padding: 26px 24px;
        display: grid;
        gap: 14px;
      }

      .hint-card h2 {
        margin: 0;
        font-size: 22px;
      }

      .hint-list {
        margin: 0;
        padding-left: 20px;
        color: var(--muted);
        line-height: 1.7;
      }

      .status-strip {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 18px;
      }

      .status-card {
        background: rgba(255, 248, 238, 0.9);
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        padding: 16px 18px;
      }

      .status-card small {
        display: block;
        color: var(--muted);
        margin-bottom: 6px;
      }

      .status-card strong {
        font-size: 19px;
      }

      .layout {
        display: grid;
        grid-template-columns: 1.25fr 0.75fr;
        gap: 18px;
        align-items: start;
      }

      .stack {
        display: grid;
        gap: 18px;
      }

      .panel {
        padding: 22px;
      }

      .panel-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }

      .panel h2 {
        margin: 0;
        font-size: 24px;
      }

      .panel p {
        margin: 6px 0 0;
        color: var(--muted);
        line-height: 1.6;
      }

      .grid {
        display: grid;
        gap: 14px;
      }

      .grid.two {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      label {
        display: grid;
        gap: 8px;
        font-size: 14px;
        color: var(--muted);
      }

      input,
      textarea,
      select {
        width: 100%;
        border: 1px solid rgba(75, 49, 32, 0.18);
        border-radius: var(--radius-sm);
        background: rgba(255, 253, 248, 0.96);
        color: var(--text);
        padding: 12px 14px;
        font: inherit;
      }

      textarea {
        min-height: 132px;
        resize: vertical;
      }

      input:focus,
      textarea:focus,
      select:focus {
        outline: 2px solid rgba(187, 90, 47, 0.2);
        border-color: rgba(187, 90, 47, 0.46);
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 14px;
      }

      button,
      .link-button {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 11px 16px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
        transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
      }

      button:hover,
      .link-button:hover {
        transform: translateY(-1px);
      }

      button:disabled {
        opacity: 0.6;
        cursor: wait;
        transform: none;
      }

      .primary {
        background: linear-gradient(135deg, var(--accent) 0%, #d6763c 100%);
        color: #fff8ef;
        box-shadow: 0 14px 32px rgba(187, 90, 47, 0.28);
      }

      .secondary {
        background: rgba(38, 24, 15, 0.08);
        color: var(--text);
      }

      .link-button {
        display: inline-flex;
        align-items: center;
        background: transparent;
        color: var(--accent-strong);
        border: 1px solid rgba(187, 90, 47, 0.22);
      }

      .file-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 10px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent-strong);
        font-size: 13px;
      }

      .console {
        padding: 22px;
        position: sticky;
        top: 20px;
      }

      .console-tabs {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 14px;
      }

      .tab {
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(38, 24, 15, 0.06);
        color: var(--muted);
        font-size: 13px;
        font-weight: 700;
      }

      .tab.active {
        background: rgba(187, 90, 47, 0.12);
        color: var(--accent-strong);
      }

      pre {
        margin: 0;
        padding: 16px;
        border-radius: 18px;
        background: #221711;
        color: #f7eedf;
        min-height: 260px;
        max-height: 600px;
        overflow: auto;
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 13px;
        line-height: 1.65;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 700;
      }

      .pill.ok {
        background: rgba(34, 122, 82, 0.14);
        color: var(--success);
      }

      .pill.fail {
        background: rgba(183, 54, 41, 0.12);
        color: var(--danger);
      }

      .result-block {
        margin-top: 14px;
        padding: 16px;
        border-radius: 18px;
        background: var(--panel-strong);
        border: 1px solid var(--line);
      }

      .result-block h3 {
        margin: 0 0 8px;
        font-size: 18px;
      }

      .citation-list {
        display: grid;
        gap: 10px;
        margin-top: 10px;
      }

      .citation {
        padding: 12px 14px;
        border-radius: 14px;
        background: rgba(38, 24, 15, 0.04);
        border: 1px solid rgba(38, 24, 15, 0.08);
      }

      .mini {
        color: var(--muted);
        font-size: 12px;
      }

      @media (max-width: 1080px) {
        .hero,
        .layout,
        .status-strip,
        .grid.two {
          grid-template-columns: 1fr;
        }

        .console {
          position: static;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <section class="hero">
        <div class="hero-card">
          <div class="eyebrow">Interactive Test Surface</div>
          <h1>RAG Playground</h1>
          <p class="hero-copy">
            API를 따로 외우지 않고도 현재 서버 상태 확인, 텍스트 적재, 파일 업로드, job
            추적, 질의 응답까지 한 화면에서 검증할 수 있는 테스트용 UI입니다.
          </p>
          <div class="hero-actions">
            <button class="primary" id="healthBtn">Health Check</button>
            <a class="link-button" href="/docs" target="_blank" rel="noreferrer">Swagger 열기</a>
          </div>
        </div>
        <aside class="hint-card">
          <h2>빠른 사용 순서</h2>
          <ol class="hint-list">
            <li>먼저 Health Check로 Chroma, Ollama 연결 상태를 본다.</li>
            <li>텍스트를 바로 넣거나 파일을 업로드한다.</li>
            <li>파일 업로드는 job 상태가 <code>completed</code>가 될 때까지 기다린다.</li>
            <li>질문을 던져 <code>answer</code>, <code>citations</code>, <code>retrieved</code>를 같이 확인한다.</li>
          </ol>
        </aside>
      </section>

      <section class="status-strip">
        <div class="status-card">
          <small>API 상태</small>
          <strong id="apiStatus">Unknown</strong>
        </div>
        <div class="status-card">
          <small>최근 Job</small>
          <strong id="jobStatus">No job yet</strong>
        </div>
        <div class="status-card">
          <small>최근 Query</small>
          <strong id="queryStatus">Not executed</strong>
        </div>
      </section>

      <section class="layout">
        <div class="stack">
          <div class="panel">
            <div class="panel-head">
              <div>
                <h2>Inline Text Ingest</h2>
                <p>짧은 텍스트와 메타데이터를 바로 넣어서 적재를 확인합니다.</p>
              </div>
              <span class="pill ok">POST /ingest/text</span>
            </div>
            <div class="grid">
              <label>
                Text
                <textarea id="ingestText">내부 기획 문서 초안: 테스트용 playground에서 health, ingest, query 흐름을 검증한다.</textarea>
              </label>
              <div class="grid two">
                <label>
                  Project
                  <input id="textProject" value="playground-demo" />
                </label>
                <label>
                  Doc Type
                  <input id="textDocType" value="memo" />
                </label>
              </div>
              <label>
                Extra Metadata JSON
                <textarea id="textMetadata">{ "source": "playground-inline", "owner": "manual-test" }</textarea>
              </label>
            </div>
            <div class="actions">
              <button class="primary" id="ingestTextBtn">텍스트 적재</button>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <div>
                <h2>File Ingest Job</h2>
                <p>파일 업로드 후 비동기 job 상태를 바로 추적합니다.</p>
              </div>
              <span class="pill ok">POST /ingest/files</span>
            </div>
            <div class="grid">
              <div class="grid two">
                <label>
                  Project
                  <input id="fileProject" value="playground-demo" />
                </label>
                <label>
                  Doc Type
                  <input id="fileDocType" value="planning" />
                </label>
              </div>
              <div class="grid two">
                <label>
                  OCR Mode
                  <select id="ocrMode">
                    <option value="off">off</option>
                    <option value="auto">auto</option>
                  </select>
                </label>
                <label>
                  Created At
                  <input id="createdAt" type="datetime-local" />
                </label>
              </div>
              <label>
                Files
                <input id="fileInput" type="file" multiple />
              </label>
              <div id="fileChips" class="file-list"></div>
            </div>
            <div class="actions">
              <button class="primary" id="ingestFilesBtn">파일 업로드</button>
              <button class="secondary" id="pollJobBtn">최근 Job 새로고침</button>
            </div>
            <div class="result-block">
              <h3>Job Snapshot</h3>
              <pre id="jobOutput">아직 job이 없습니다.</pre>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <div>
                <h2>Query</h2>
                <p>필터와 topK를 넣고 grounded answer와 citation을 함께 확인합니다.</p>
              </div>
              <span class="pill ok">POST /query</span>
            </div>
            <div class="grid">
              <label>
                Question
                <textarea id="queryText">playground-demo 프로젝트 문서의 핵심 범위를 요약해줘</textarea>
              </label>
              <div class="grid two">
                <label>
                  Top K
                  <input id="topK" type="number" min="1" max="20" value="6" />
                </label>
                <label>
                  Filters JSON
                  <textarea id="queryFilters">{ "project": "playground-demo" }</textarea>
                </label>
              </div>
            </div>
            <div class="actions">
              <button class="primary" id="queryBtn">질의 실행</button>
            </div>
            <div class="result-block">
              <h3>Answer</h3>
              <div id="answerOutput" class="mini">아직 실행하지 않았습니다.</div>
              <div class="citation-list" id="citationList"></div>
            </div>
          </div>
        </div>

        <aside class="console">
          <div class="console-tabs">
            <span class="tab active">Live Log</span>
            <span class="tab">Raw JSON</span>
          </div>
          <pre id="consoleOutput">Playground ready.</pre>
        </aside>
      </section>
    </div>

    <script>
      const state = {
        latestJobId: null,
      };

      const el = {
        apiStatus: document.getElementById('apiStatus'),
        jobStatus: document.getElementById('jobStatus'),
        queryStatus: document.getElementById('queryStatus'),
        consoleOutput: document.getElementById('consoleOutput'),
        answerOutput: document.getElementById('answerOutput'),
        citationList: document.getElementById('citationList'),
        jobOutput: document.getElementById('jobOutput'),
        fileChips: document.getElementById('fileChips'),
      };

      const buttons = {
        health: document.getElementById('healthBtn'),
        ingestText: document.getElementById('ingestTextBtn'),
        ingestFiles: document.getElementById('ingestFilesBtn'),
        pollJob: document.getElementById('pollJobBtn'),
        query: document.getElementById('queryBtn'),
      };

      function appendLog(title, payload) {
        const stamp = new Date().toLocaleTimeString('ko-KR', { hour12: false });
        const next = [
          '[' + stamp + '] ' + title,
          typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2),
          '',
          el.consoleOutput.textContent,
        ].join('\n');
        el.consoleOutput.textContent = next.trim();
      }

      function parseJsonInput(value, fallback) {
        if (!value || !value.trim()) {
          return fallback;
        }
        return JSON.parse(value);
      }

      function setBusy(button, busy) {
        button.disabled = busy;
      }

      function renderFiles() {
        const files = Array.from(document.getElementById('fileInput').files || []);
        el.fileChips.innerHTML = files
          .map((file) => '<span class="chip">' + file.name + ' · ' + Math.round(file.size / 1024 || 1) + 'KB</span>')
          .join('');
      }

      async function requestJson(url, options) {
        const response = await fetch(url, options);
        const raw = await response.text();
        let data;
        try {
          data = raw ? JSON.parse(raw) : null;
        } catch {
          data = raw;
        }

        if (!response.ok) {
          throw {
            status: response.status,
            data,
          };
        }

        return data;
      }

      async function runHealth() {
        setBusy(buttons.health, true);
        try {
          const data = await requestJson('/health');
          el.apiStatus.textContent = data.status + ' / chroma=' + data.chroma + ' / ollama=' + data.ollama;
          appendLog('GET /health', data);
        } catch (error) {
          el.apiStatus.textContent = 'failed';
          appendLog('GET /health failed', error);
        } finally {
          setBusy(buttons.health, false);
        }
      }

      async function ingestText() {
        setBusy(buttons.ingestText, true);
        try {
          const payload = {
            text: document.getElementById('ingestText').value,
            metadata: {
              project: document.getElementById('textProject').value,
              docType: document.getElementById('textDocType').value,
              ...parseJsonInput(document.getElementById('textMetadata').value, {}),
            },
          };
          const data = await requestJson('/ingest/text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          appendLog('POST /ingest/text', data);
        } catch (error) {
          appendLog('POST /ingest/text failed', error);
        } finally {
          setBusy(buttons.ingestText, false);
        }
      }

      async function ingestFiles() {
        const files = Array.from(document.getElementById('fileInput').files || []);
        if (files.length === 0) {
          appendLog('POST /ingest/files blocked', '업로드할 파일을 먼저 선택하세요.');
          return;
        }

        setBusy(buttons.ingestFiles, true);
        try {
          const form = new FormData();
          files.forEach((file) => form.append('files', file));
          form.append('project', document.getElementById('fileProject').value);
          form.append('docType', document.getElementById('fileDocType').value);
          form.append('ocrMode', document.getElementById('ocrMode').value);
          const createdAt = document.getElementById('createdAt').value;
          if (createdAt) {
            form.append('createdAt', new Date(createdAt).toISOString());
          }

          const data = await requestJson('/ingest/files', {
            method: 'POST',
            body: form,
          });

          state.latestJobId = data.jobId;
          el.jobStatus.textContent = data.status + ' / ' + data.jobId;
          el.jobOutput.textContent = JSON.stringify(data, null, 2);
          appendLog('POST /ingest/files', data);
          pollLatestJob(true);
        } catch (error) {
          appendLog('POST /ingest/files failed', error);
        } finally {
          setBusy(buttons.ingestFiles, false);
        }
      }

      async function pollLatestJob(autoRetry) {
        if (!state.latestJobId) {
          appendLog('GET /ingest/jobs/:jobId blocked', '최근 job이 없습니다.');
          return;
        }

        setBusy(buttons.pollJob, true);
        try {
          const data = await requestJson('/ingest/jobs/' + state.latestJobId);
          el.jobStatus.textContent = data.status + ' / ' + data.jobId;
          el.jobOutput.textContent = JSON.stringify(data, null, 2);
          appendLog('GET /ingest/jobs/' + state.latestJobId, data);

          if (autoRetry && (data.status === 'queued' || data.status === 'processing')) {
            setTimeout(() => pollLatestJob(true), 1200);
          }
        } catch (error) {
          appendLog('GET /ingest/jobs failed', error);
        } finally {
          setBusy(buttons.pollJob, false);
        }
      }

      async function query() {
        setBusy(buttons.query, true);
        try {
          const payload = {
            question: document.getElementById('queryText').value,
            topK: Number(document.getElementById('topK').value || 6),
            filters: parseJsonInput(document.getElementById('queryFilters').value, {}),
          };

          const data = await requestJson('/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          el.queryStatus.textContent = 'answer received';
          el.answerOutput.textContent = data.answer || '(empty)';
          el.citationList.innerHTML = (data.citations || [])
            .map(
              (citation, index) =>
                '<div class="citation">' +
                '<strong>[' + (index + 1) + '] ' + (citation.source || 'unknown') + '</strong>' +
                '<div class="mini">docId=' + (citation.docId || 'n/a') +
                ' · pageOrSlide=' + (citation.pageOrSlide ?? 'n/a') +
                ' · chunkId=' + (citation.chunkId || 'n/a') + '</div>' +
                '<div>' + (citation.excerpt || '') + '</div>' +
                '</div>',
            )
            .join('');

          appendLog('POST /query', data);
        } catch (error) {
          el.queryStatus.textContent = 'failed';
          appendLog('POST /query failed', error);
        } finally {
          setBusy(buttons.query, false);
        }
      }

      document.getElementById('fileInput').addEventListener('change', renderFiles);
      buttons.health.addEventListener('click', runHealth);
      buttons.ingestText.addEventListener('click', ingestText);
      buttons.ingestFiles.addEventListener('click', ingestFiles);
      buttons.pollJob.addEventListener('click', () => pollLatestJob(false));
      buttons.query.addEventListener('click', query);

      document.getElementById('createdAt').value = new Date().toISOString().slice(0, 16);
      runHealth();
    </script>
  </body>
</html>`;
