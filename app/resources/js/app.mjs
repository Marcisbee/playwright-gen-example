// @ts-check
import { html, useLayoutEffect, useState } from 'https://unpkg.com/htm@3.1.1/preact/standalone.module.js'

export function App() {
  const [cwd, setCwd] = useState("");

  async function selectCdm() {
    const entry = await Neutralino.os.showFolderDialog('Select project directory');

    if (!entry) {
      return;
    }

    try {
      const tasksFile = await Neutralino.filesystem.readFile(entry + '/tasks.sh');

      if (!tasksFile) {
        throw new Error("Project not found");
      }
    } catch (e) {
      console.error(e);
      return;
    }

    setCwd(entry);
    console.log('You have selected:', entry);
  }

  if (!cwd) {
    return html`<button onclick=${selectCdm}>Select project</button>`;
  }

  return html`<${Project} cwd=${cwd} />`;
}

/**
 * @param {{ cwd: string }} props
 */
function Project({ cwd }) {
  const [error, setError] = useState("");
  const [tab, setTab] = useState("run");
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    async function load() {
      setError("");

      const result  = await Neutralino.os.execCommand("./tasks.sh prepare", { cwd });

      if (result.stdErr) {
        console.error(result.stdErr);
        setError(result.stdErr);
        return;
      }

      setLoading(false);
    }

    load();
  }, [cwd]);

  if (error) {
    return html`
      <div>
        <h1>${iconPlaywright()} ${cwd}</h1>

        <h2>error</h2>

        <pre>${error}</pre>
      </div>
    `;
  }

  if (loading) {
    return html`
      <div>
        <h1>${iconPlaywright()} ${cwd}</h1>

        Loading...
      </div>
    `;
  }

  return html`
    <div>
      <h1>${iconPlaywright()} ${cwd}</h1>

      <menu>
        <button type="button" class=${tab === "run" ? "active" : undefined} onclick=${() => setTab("run")}>Run Tests</button>
        <button type="button" class=${tab === "generate-test" ? "active" : undefined} onclick=${() => setTab("generate-test")}>Generate test</button>
        <button type="button" class=${tab === "generate-auth" ? "active" : undefined} onclick=${() => setTab("generate-auth")}>Generate auth</button>
      </menu>

      <br />

      ${tab === 'run' && html`<${ProjectTest} cwd=${cwd} />`}
      ${tab === 'generate-test' && html`<${ProjectGenerate} cwd=${cwd} />`}
      ${tab === 'generate-auth' && html`<${ProjectSetup} cwd=${cwd} />`}
    </div>
  `;
}

/**
 * @param {{ cwd: string }} props
 */
function ProjectSetup({ cwd }) {
  const [setupDir, setSetupDir] = useState("");
  const [url, setUrl] = useState("");
  const [saveAuth, setSaveAuth] = useState(true);
  const [auth, setAuth] = useState("");
  const [proc, setProc] = useState(null);
  const [_, logs] = useLogs(proc, setProc);
  const [authList, reloadAuthList] = useAuthList(proc, () => setSetupDir(""), cwd);

  async function selectSetupDir() {
    const output = await Neutralino.os.showFolderDialog('Create setup dir');
    setSetupDir(output);
  }

  async function generateTest() {
    const setupOutput = `${setupDir}/setup.ts`;
    const authOutput = `${setupDir}/auth.json`;
    const authInput = `${auth}/auth.json`;

    const commands = [
      "./tasks.sh codegen",
      `--output=${JSON.stringify(setupOutput)}`,
      saveAuth && `--save-storage=${JSON.stringify(authOutput)}`,
      /^\//.test(auth || "") && `--load-storage=${JSON.stringify(authInput)}`,
      url,
    ].filter(Boolean);

    const proc = await Neutralino.os.spawnProcess(commands.join(" "), { cwd });
    setProc(proc);
  }

  return html`
    <div>
      <h2>
        <span>Generate Auth</span>
      </h2>
      <div>
        <label>
          <span>Load auth</span>
          <br />
          <select value=${auth} oninput=${(e) => setAuth(e.target.value)}>
            <option value="">none</option>
            ${authList.map((entry) => html`
              <option value=${entry.path}>${entry.entry}</option>
            `)}
          </select>
        </label>
        <button type="button" onclick=${reloadAuthList}>refresh</button>

        <br />
        <br />

        <label>
          <span>Test url</span>
          <br />
          <input
            type="text"
            value=${url}
            oninput=${(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </label>

        <br />
        <br />

        <label>
          <span>Auth folder location</span>
          <br />
          <input
            type="text"
            value=${setupDir}
            readonly
          />
        </label>
        <button type="button" onclick=${selectSetupDir}>select</button>

        <br />
        <br />

        <label>
          <input
            type="checkbox"
            checked=${saveAuth}
            oninput=${(e) => setSaveAuth(e.target.checked)}
          />
          <span> Save auth file</span>
        </label>

        <br />
        <br />

        ${proc ? html`
          <button onclick=${() => Neutralino.os.updateSpawnedProcess(proc.id, 'exit')}>Stop</button>
        ` : html`
          <button onclick=${generateTest} disabled=${!setupDir || !url}>Start</button>
        `}
      </div>
      <br />
      <details>
        <summary>Logs</summary>
        <pre innerHTML=${logs} />
      </details>
    </div>
  `;
}

function ProjectVariables() {
  return html`
    <hr />
    <div>
      <h2>
        <span>Variables</span>
      </h2>
      <div>
        Variable A: 1
        <br />
        Save to .env.template & read from it too
        NAME_1: DATE
      </div>
    </div>
  `;
}

/**
 * @param {{ cwd: string }} props
 */
function ProjectGenerate({ cwd }) {
  const [output, setOutput] = useState("");
  const [url, setUrl] = useState("");
  const [auth, setAuth] = useState("");
  const [proc, setProc] = useState(null);
  const [_, logs] = useLogs(proc, setProc);
  const [authList, reloadAuthList] = useAuthList(proc, () => setOutput(""), cwd);

  async function selectTestFile() {
    const output = await Neutralino.os.showSaveDialog('Create setup file', {
      filters: [
        {name: 'Setup file', extensions: ['ts']},
      ]
    });
    setOutput(output);
  }

  async function generateTest() {
    const authInput = `${auth}/auth.json`;

    const commands = [
      "PLAYWRIGHT_FORCE_TTY=0 FORCE_COLOR=0 ./tasks.sh codegen",
      `--output=${JSON.stringify(output)}`,
      /^\//.test(auth || "") && `--load-storage=${JSON.stringify(authInput)}`,
      url,
    ].filter(Boolean);

    const proc = await Neutralino.os.spawnProcess(commands.join(" "), { cwd });
    setProc(proc);
  }

  return html`
    <div>
      <h2>
        <span>Generate Test</span>
      </h2>
      <div>
        <label>
          <span>Load auth</span>
          <br />
          <select value=${auth} oninput=${(e) => setAuth(e.target.value)}>
            <option value="">none</option>
            ${authList.map((entry) => html`
              <option value=${entry.path}>${entry.entry}</option>
            `)}
          </select>
        </label>
        <button type="button" onclick=${reloadAuthList}>refresh</button>

        <br />
        <br />

        <label>
          <span>Test url</span>
          <br />
          <input
            type="text"
            value=${url}
            oninput=${(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </label>

        <br />
        <br />

        <label>
          <span>Test file location</span>
          <br />
          <input
            type="text"
            value=${output}
            readonly
          />
        </label>
        <button type="button" onclick=${selectTestFile}>select</button>

        <br />
        <br />

        ${proc ? html`
          <button onclick=${() => Neutralino.os.updateSpawnedProcess(proc.id, 'exit')}>Stop</button>
        ` : html`
          <button onclick=${generateTest} disabled=${!output || !url}>Start</button>
        `}
      </div>
      <br />
      <details>
        <summary>Logs</summary>
        <pre innerHTML=${logs} />
      </details>
    </div>
  `;
}

/**
 * @param {{ cwd: string }} props
 */
function ProjectTest({ cwd }) {
  const [grep, setGrep] = useState("pocketbase");
  const [procReport, setProcReport] = useState(null);
  const [proc, setProc] = useState(null);
  const [rawLogs, logs] = useLogs(proc, setProc);
  const [tests, setTests] = useState([]);
  const [testsRunning, setTestsRunning] = useState([]);
  const [testsStatus, setTestsStatus] = useState([]);

  /**
   * @param {boolean=} filter
   */
  async function getTestList(filter) {
    const cmd = [
      `PLAYWRIGHT_FORCE_TTY=0 FORCE_COLOR=0 ./tasks.sh test --reporter="list" --list`,
      filter && `--grep=${JSON.stringify(`/${grep}/`)}`,
    ].filter(Boolean);
    const result  = await Neutralino.os.execCommand(cmd.join(" "), { cwd });

    if (result.stdErr) {
      console.error(result.stdErr)
    }

    const lines = result.stdOut.split("\n");
    lines.splice(0, lines.findIndex((line) => /^Listing tests:/.test(line)) + 1);
    lines.splice(lines.findIndex((line) => /^Total: /.test(line)), lines.length);

    return lines.map((line) => {
      const [type, path, name] = line.trim().split(" › ");

      return {
        type: type === '[setup]' ? 'auth' : 'test',
        path: path.replace(/^.*file\:|\:\d+\:\d+$/g, "").slice(cwd.length),
        name,
      }
    });
  }

  function getTestStatusList() {
    const lines = logs.split("\n").filter((line) => (
      /^  [✘✓]  \d+ \[\w+\] › [a-z0-9:\-_\/\.]+ › \w+/.test(line)
    ));

    return lines.map((line) => {
      const [_, status, type, path, name] = line.match(/^  ([✘✓])  \d+ \[(\w+)\] › ([a-z0-9:\-_\/\.]+) › (\w+)/) || [];

      return {
        type,
        path: path.replace(/^.*file\:|\:\d+\:\d+$/g, "").slice(cwd.length),
        status: status === "✓" ? 'pass' : 'fail',
        name,
      }
    });
  }

  useLayoutEffect(() => {
    setTestsStatus(getTestStatusList());
  }, [logs]);

  useLayoutEffect(() => {
    async function updateTestList() {
      setTests(await getTestList());
    }

    updateTestList();

    window.addEventListener("focus", updateTestList);

    return () => {
      window.removeEventListener("focus", updateTestList);
    };
  }, [cwd]);

  async function runReport() {
    const proc = await Neutralino.os.spawnProcess(`./tasks.sh report`, { cwd });
    setProcReport(proc);
  }

  async function runTests() {
    setTestsRunning(await getTestList(true));

    const proc = await Neutralino.os.spawnProcess(`PLAYWRIGHT_FORCE_TTY=0 FORCE_COLOR=0 ./tasks.sh test --grep=${JSON.stringify(`/${grep}/`)}`, { cwd });
    setProc(proc);
  }

  const testsList = tests.map((t1) => {
    const run = !!testsRunning.find((t2) => t1.path === t2.path);
    const status = run && (testsStatus.find((t2) => t1.path === t2.path)?.status) || 'idle';

    return {
      ...t1,
      run,
      status,
    };
  });

  const testsAreRunning = !!(rawLogs && proc);

  async function stopReport() {
    await Neutralino.os.updateSpawnedProcess(procReport.id, 'exit');
    setProcReport(null);
  }

  return html`
    <div>
      <h2>
        <span>Run Tests</span>
      </h2>
      <div>
        <label>
          <span>Test scope</span>
          <br />
          <input
            type="text"
            value=${grep}
            oninput=${(e) => setGrep(e.target.value)}
          />
        </label>

        <br />
        <br />

        ${proc ? html`
          <button onclick=${() => Neutralino.os.updateSpawnedProcess(proc.id, 'exit')}>Stop</button>
        ` : html`
          <button onclick=${runTests}>Start</button>
        `}

        ${procReport ? html`
          <dialog ref=${(e) => {e?.showModal()}} onclose=${stopReport}>
            <h3>Report is running</h3>
            <button onclick=${stopReport}>Stop</button>
          </dialog>

          <button onclick=${stopReport}>Stop</button>
        ` : html`
          <button onclick=${runReport} disabled=${!(!proc && !!rawLogs)}>Show report</button>
        `}
      </div>
      <br />
      <ul>
        ${testsList.map((test) => html`
          <li>
            ${!test.run && iconIdle()}
            ${!!(testsAreRunning && test.run && test.status === "idle") && iconLoad()}
            ${!!(test.run && test.status === "pass") && iconPass()}
            ${!!(test.run && test.status === "fail") && iconFail()}
            ${!!(!testsAreRunning && test.run && test.status === "idle") && iconSkip()}
            ${" "}<b>[${test.type}]:</b> ${test.path}
          </li>
        `)}
      </ul>
      <details>
        <summary>Logs</summary>
        <pre innerHTML=${logs} />
      </details>
    </div>
  `;
}

function terminalEscapeCodesToHTML(text) {
  return '<span>' +
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/1A\x1B\[2K/g, "")
      .replace(/\x1B\[([^m]*)m/g, (_, escape) => {
        switch (escape) {
          case '1': return '</span><span class="color-bold">'
          case '31': return '</span><span class="color-red">'
          case '32': return '</span><span class="color-green">'
          case '33': return '</span><span class="color-yellow">'
          case '35': return '</span><span class="color-magenta">' // This is generated by warnings in version 0.14.0 and earlier
          case '37': return '</span><span class="color-dim">'
          case '41;31': return '</span><span class="bg-red color-red">'
          case '41;97': return '</span><span class="bg-red color-white">'
          case '43;33': return '</span><span class="bg-yellow color-yellow">'
          case '43;30': return '</span><span class="bg-yellow color-black">'
          case '0': return '</span><span>'
        }
        return escape
      }) +
    '</span>'
}

/**
 * @param {Neutralino.os.SpawnedProcess | null} proc
 * @param {(arg: Neutralino.os.SpawnedProcess | null) => void} setProc
 */
function useLogs(proc, setProc) {
  const [logs, setLogs] = useState("");

  useLayoutEffect(() => {
    if (!proc) {
      return;
    }

    setLogs("");

    /**
     * @param {CustomEvent<any>} evt
     */
    function handler(evt) {
      if(proc?.id == evt.detail.id) {
        switch(evt.detail.action) {
          case 'stdOut':
            setLogs((l) => l + evt.detail.data);
            break;
          case 'stdErr':
            setLogs((l) => l + evt.detail.data);
            break;
          case 'exit':
            setLogs((l) => l + `Process terminated with exit code: ${evt.detail.data}`);
            setProc(null);
            break;
        }
      }
    }

    Neutralino.events.on('spawnedProcess', handler);

    return () => {
      Neutralino.events.off('spawnedProcess', handler)
    }
  }, [proc]);

  return [logs, terminalEscapeCodesToHTML(logs)];
}

function useAuthList(proc, reset, cwd) {
  const [authList, setAuthList] = useState([]);

  useLayoutEffect(() => {
    reloadAuthList();

    if (!proc) {
      reset();
    }
  }, [proc]);

  useLayoutEffect(() => {
    window.addEventListener("focus", reloadAuthList);

    return () => {
      window.removeEventListener("focus", reloadAuthList);
    };
  }, [proc]);

  async function reloadAuthList() {
    const sessionPath = `${cwd}/session/`;
    const entries = await Neutralino.filesystem.readDirectory(sessionPath);

    const entriesWithAuth = (await Promise.all(
      entries
        .filter((entry) => entry.type === 'DIRECTORY')
        .map((entry) => (
          Neutralino.filesystem.readFile(`${entry.path}/auth.json`)
            .then((content) => content && entry)
            .catch(() => {})
        ))
    )).filter(Boolean);

    setAuthList(entriesWithAuth);
  }

  return [authList, reloadAuthList];
}

function iconPlaywright() {
  return html`<svg width="36" height="36" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path d="M43.662 70.898c-4.124 1.17-6.829 3.222-8.611 5.272 1.707-1.494 3.993-2.865 7.077-3.739 3.155-.894 5.846-.888 8.069-.459v-1.739c-1.897-.173-4.072-.035-6.536.664ZM34.863 56.28l-15.314 4.035s.279.394.796.92l12.984-3.421s-.184 2.371-1.782 4.492c3.022-2.287 3.316-6.025 3.316-6.025Zm12.819 35.991C26.131 98.076 14.729 73.1 11.277 60.137 9.682 54.153 8.986 49.621 8.8 46.697a4.955 4.955 0 0 1 .011-.794c-1.118.068-1.653.649-1.544 2.328.186 2.923.882 7.454 2.477 13.44 3.45 12.961 14.854 37.937 36.405 32.132 4.691-1.264 8.215-3.565 10.86-6.504-2.438 2.202-5.49 3.937-9.327 4.972Zm4.05-51.276v1.534h8.453c-.173-.543-.348-1.032-.522-1.534h-7.932Z" fill="#2D4552"/><path d="M62.074 53.627c3.802 1.08 5.812 3.745 6.875 6.104l4.239 1.204s-.578-8.255-8.045-10.376c-6.985-1.985-11.284 3.881-11.807 4.64 2.032-1.448 4.999-2.633 8.738-1.572Zm33.741 6.142c-6.992-1.994-11.289 3.884-11.804 4.633 2.034-1.446 4.999-2.632 8.737-1.566 3.796 1.081 5.804 3.743 6.87 6.104l4.245 1.208s-.588-8.257-8.048-10.379Zm-4.211 21.766-35.261-9.858s.382 1.935 1.846 4.441l29.688 8.3c2.444-1.414 3.726-2.883 3.726-2.883Zm-24.446 21.218c-27.92-7.485-24.544-43.059-20.027-59.916 1.86-6.947 3.772-12.11 5.358-15.572-.946-.195-1.73.304-2.504 1.878-1.684 3.415-3.837 8.976-5.921 16.76-4.516 16.857-7.892 52.429 20.027 59.914 13.159 3.525 23.411-1.833 31.053-10.247-7.254 6.57-16.515 10.253-27.986 7.182Z" fill="#2D4552"/><path d="M51.732 83.935v-7.179l-19.945 5.656s1.474-8.563 11.876-11.514c3.155-.894 5.846-.888 8.069-.459V40.995h9.987c-1.087-3.36-2.139-5.947-3.023-7.744-1.461-2.975-2.96-1.003-6.361 1.842-2.396 2.001-8.45 6.271-17.561 8.726-9.111 2.457-16.476 1.805-19.55 1.273-4.357-.752-6.636-1.708-6.422 1.605.186 2.923.882 7.455 2.477 13.44 3.45 12.962 14.854 37.937 36.405 32.132 5.629-1.517 9.603-4.515 12.357-8.336h-8.309v.002Zm-32.185-23.62 15.316-4.035s-.446 5.892-6.188 7.405c-5.743 1.512-9.128-3.371-9.128-3.371Z" fill="#E2574C"/><path d="M109.372 41.336c-3.981.698-13.532 1.567-25.336-1.596-11.807-3.162-19.64-8.692-22.744-11.292-4.4-3.685-6.335-6.246-8.24-2.372-1.684 3.417-3.837 8.977-5.921 16.762-4.516 16.857-7.892 52.429 20.027 59.914 27.912 7.479 42.772-25.017 47.289-41.875 2.084-7.783 2.998-13.676 3.25-17.476.287-4.305-2.67-3.055-8.324-2.064ZM53.28 55.282s4.4-6.843 11.862-4.722c7.467 2.121 8.045 10.376 8.045 10.376L53.28 55.282Zm18.215 30.706c-13.125-3.845-15.15-14.311-15.15-14.311l35.259 9.858c0-.002-7.117 8.25-20.109 4.453Zm12.466-21.51s4.394-6.838 11.854-4.711c7.46 2.124 8.048 10.379 8.048 10.379l-19.902-5.668Z" fill="#2EAD33"/><path d="M44.762 78.733 31.787 82.41s1.41-8.029 10.968-11.212l-7.347-27.573-.635.193c-9.111 2.457-16.476 1.805-19.55 1.273-4.357-.751-6.636-1.708-6.422 1.606.186 2.923.882 7.454 2.477 13.44 3.45 12.961 14.854 37.937 36.405 32.132l.635-.199-3.555-13.337ZM19.548 60.315l15.316-4.035s-.446 5.892-6.188 7.405c-5.743 1.512-9.128-3.371-9.128-3.371Z" fill="#D65348"/><path d="m72.086 86.132-.594-.144c-13.125-3.844-15.15-14.311-15.15-14.311l18.182 5.082L84.15 39.77l-.116-.031c-11.807-3.162-19.64-8.692-22.744-11.292-4.4-3.685-6.335-6.246-8.24-2.372-1.682 3.417-3.836 8.977-5.92 16.762-4.516 16.857-7.892 52.429 20.027 59.914l.572.129 4.357-16.748Zm-18.807-30.85s4.4-6.843 11.862-4.722c7.467 2.121 8.045 10.376 8.045 10.376l-19.907-5.654Z" fill="#1D8D22"/><path d="m45.423 78.544-3.48.988c.822 4.634 2.271 9.082 4.545 13.011.396-.087.788-.163 1.192-.273a25.224 25.224 0 0 0 2.98-1.023c-2.541-3.771-4.222-8.114-5.237-12.702Zm-1.359-32.64c-1.788 6.674-3.388 16.28-2.948 25.915a20.061 20.061 0 0 1 2.546-.923l.644-.144c-.785-10.292.912-20.78 2.825-27.915a139.404 139.404 0 0 1 1.455-5.05 45.171 45.171 0 0 1-2.578 1.53 132.234 132.234 0 0 0-1.944 6.587Z" fill="#C04B41"/></svg>`
}

function iconIdle() {
  return html`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" style="color:gray;" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.1 2.182a10 10 0 0 1 3.8 0m0 19.636a10 10 0 0 1-3.8 0m7.509-18.097a10 10 0 0 1 2.69 2.7M2.182 13.9a10 10 0 0 1 0-3.8m18.097 7.509a10 10 0 0 1-2.7 2.69M21.818 10.1a10 10 0 0 1 0 3.8M3.721 6.391a10 10 0 0 1 2.7-2.69m-.03 16.578a10 10 0 0 1-2.69-2.7"/></svg>`
}

function iconLoad() {
  return html`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2v4m4.2 1.8l2.9-2.9M18 12h4m-5.8 4.2l2.9 2.9M12 18v4m-7.1-2.9l2.9-2.9M2 12h4M4.9 4.9l2.9 2.9"/></svg>`
}

function iconPass() {
  return html`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" style="color:green;" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12l2 2l4-4"/></g></svg>`
}

function iconFail() {
  return html`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" style="color:orangered;" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9l-6 6m0-6l6 6"/></g></svg>`
}

function iconSkip() {
  return html`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" style="color:gray;" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M8 12h8m-4-4"/><circle cx="12" cy="12" r="10"/></g></svg>`
}
