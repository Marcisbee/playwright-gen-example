const output = Deno.args.find((arg) => arg.indexOf("--output=") === 0)?.split("=")?.[1];
const saveStorage = Deno.args.find((arg) => arg.indexOf("--save-storage=") === 0)?.split("=")?.[1];

if (output && saveStorage) {
  const file = Deno.readTextFileSync(output);

  if (!/await page\.context\(\)\.storageState/.test(file)) {
    const updatedFile = file.replace(/\}\);[\S]*$/, `\n  await page.context().storageState({ path: ${JSON.stringify(saveStorage)} });\n});\n`);

    Deno.writeTextFileSync(output, updatedFile);
  }
}
