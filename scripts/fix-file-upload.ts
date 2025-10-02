// @ts-nocheck

(() => {
	const output = Deno.args.find((arg) => arg.startsWith("--output="))?.split("=")?.[1];

	if (!output) {
		return;
	}

	const original = Deno.readTextFileSync(output);
	const pattern = /([ \t]*)await\s+(page[^\n;]*?)\.click\(\);\s*\n\1await\s+\2\.setInputFiles\(([^)]+)\);\s*/g;
	let index = 0;

	const updated = original.replace(pattern, (match, indent, expr, fileArg) => {
		const trimmed = String(fileArg).trim();
		let fileName: string | null = null;

		const literalMatch = /^['"`](.+)['"`]$/.exec(trimmed);

		if (literalMatch) {
			fileName = literalMatch[1];
		} else {
			const arrayMatch = /^\[\s*['"`](.+)['"`]\s*\]$/.exec(trimmed);

			if (arrayMatch) {
				fileName = arrayMatch[1];
			}
		}

		if (!fileName) {
			return match;
		}

		const varName = index === 0 ? "fileChooserPromise" : `fileChooserPromise${index + 1}`;
		index += 1;

		return `${indent}const ${varName} = page.waitForEvent('filechooser');\n` +
			`${indent}await ${expr}.click();\n` +
			`${indent}await (await ${varName}).setFiles(__dirname.split("/").slice(0, -2).concat('uploads', ${JSON.stringify(fileName)}).join("/"));\n${indent}`;
	});

	if (updated !== original) {
		Deno.writeTextFileSync(output, updated);
	}
})();
