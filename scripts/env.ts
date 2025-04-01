const timestamp = Date.now();
let index = 0;

const build: Record<string, () => string> = {
  generic() {
    return `TEST_${timestamp + (index++)}`;
  },
  email() {
    return `rand_qa_pw+${timestamp + (index++)}@mail7.app`;
  },
};

const decoder = new TextDecoder();
let stdin = "";
for await (const chunk of Deno.stdin.readable) {
  stdin += decoder.decode(chunk);
}

if (stdin.trim()) {
  const config: { var: Record<string, string> } = JSON.parse(stdin);
  const output: string[] = [];

  for (const [name, type] of Object.entries(config.var)) {
    output.push(`${name}=${JSON.stringify(build[type]())}`);
  }

  console.log(output.join("\n"));
}

export {};
