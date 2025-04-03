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
  const config: Record<string, string> = stdin.split("\n").reduce((acc, keyValue) => {
    const [key, value] = keyValue.split("=");

    if (key) {
      acc[key] = value;
    }

    return acc;
  }, {});
  const output: string[] = [];

  for (const [name, type] of Object.entries(config)) {
    output.push(`${name}=${JSON.stringify(build[type]() || null)}`);
  }

  console.log(output.join("\n"));
}

export { };
