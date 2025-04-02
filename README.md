# Playwright test gen

## Desktop app install (optional):
```sh
curl -SsfL https://raw.githubusercontent.com/Marcisbee/playwriter/refs/heads/main/install.sh | bash
```

To work with this you'll need to run these commands in "Terminal" app from macos (note that mouse probably won't really help there, use keyboard).

1. Run all tests:
```sh
./tasks.sh test
```

If some test fails, terminal process will remain active + it'll open report in browser. To cancel/close process in terminal, press CTRL+C.

---

## Todo test example
- Generate simple test:
```sh
./tasks.sh codegen --output="tests/todo-mvc-2.ts" https://demo.playwright.dev/todomvc
```

It will start test with `https://demo.playwright.dev/todomvc` as initial page and save test file in `tests/todo-mvc-2.ts`.

Make sure test file ends with `.ts` file extension.
Close browser to end test generation.

---

## Pocketbase/Login test example

It will start test with `https://demo.playwright.dev/todomvc` as initial page.

1. Create pocketbase auth session (make sure output file is named `setup.ts`):
```sh
./tasks.sh codegen https://pocketbase.io/_ --output="session/pocketbase/setup.ts" --save-storage="session/pocketbase/auth.json"
```

Open setup.ts file and append (some playwright bug that it doesn't generate this part) after last line with `await` in front:
```ts
await page.context().storageState({ path: 'session/pocketbase/auth.json' });
```

2. Create pocketbase tests (prepend 001, 002, etc to set execution order, note `setup.ts` files will always run before everything else):
```sh
./tasks.sh codegen https://pocketbase.io/_ --output="tests/pocketbase/001-add-collection.ts" --load-storage="session/pocketbase/auth.json"
```
```sh
./tasks.sh codegen https://pocketbase.io/_ --output="tests/pocketbase/002-add-row.ts" --load-storage="session/pocketbase/auth.json"
```
```sh
./tasks.sh codegen https://pocketbase.io/_ --output="tests/pocketbase/003-remove-row.ts" --load-storage="session/pocketbase/auth.json"
```
```sh
./tasks.sh codegen https://pocketbase.io/_ --output="tests/pocketbase/004-remove-collection.ts" --load-storage="session/pocketbase/auth.json"
```

3. Run only pocketbase tests:
```sh
./tasks.sh test --grep "/pocketbase/"
```

4. Get report:
```sh
./tasks.sh show-report
```
