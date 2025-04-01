// @ts-check
import { html, useLayoutEffect, useState } from 'https://unpkg.com/htm@3.1.1/preact/standalone.module.js'

export function App() {
  const [cwd, setCwd] = useState("");

  async function selectCdm() {
    const entry = await Neutralino.os.showFolderDialog('Select project directory');

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
        <h1>${cwd}</h1>
        <hr />

        <h2>error</h2>

        <pre>${error}</pre>
      </div>
    `;
  }

  if (loading) {
    return html`
      <div>
        <h1>${cwd}</h1>
        <hr />

        Loading...
      </div>
    `;
  }

  return html`
    <div>
      <h1>${cwd}</h1>
      <hr />

      <${ProjectSetup} cwd=${cwd} />
      <hr />
      <${ProjectGenerate} cwd=${cwd} />
      <hr />
      <${ProjectTest} cwd=${cwd} />
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
            value=${url}
            oninput=${(e) => setUrl(e.target.value)}
          />
        </label>

        <br />
        <br />

        <label>
          <span>Auth folder location</span>
          <br />
          <input
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
            value=${url}
            oninput=${(e) => setUrl(e.target.value)}
          />
        </label>

        <br />
        <br />

        <label>
          <span>Test file location</span>
          <br />
          <input
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
      `PLAYWRIGHT_FORCE_TTY=0 FORCE_COLOR=0 ./tasks.sh test --list`,
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
      <ul>
        ${testsList.map((test) => html`
          <li>
            ${!test.run && iconIdle()}
            ${!!(testsAreRunning && test.run && test.status === "idle") && iconLoad()}
            ${!!(test.run && test.status === "pass") && iconPass()}
            ${!!(test.run && test.status === "fail") && iconFail()}
            ${!!(!testsAreRunning && test.run && test.status === "idle") && iconSkip()}
            - ${test.type}
            - ${test.path}
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
