#!/usr/bin/env bash

task_gen_env() {
  ./deno run ./scripts/env.ts < ./env.config > .env
}

# ./tasks.sh test --grep="/pocketbase/"
task_test() {
  start_task gen_env

  PW_DISABLE_TS_ESM=1 ./deno run --env-file=.env --allow-all npm:playwright@1.51.1 test --trace=on "${@}"
}

# ./tasks.sh codegen --output="./todo-mvc-3.ts" https://demo.playwright.dev/todomvc
task_codegen() {
  ./deno run --allow-all --env-file=.env npm:playwright@1.51.1 codegen --target="playwright-test" "${@}"
  ./deno run --allow-all ./scripts/fix-save-auth-path.ts "${@}"
}

# ./tasks.sh types
task_types() {
  ./deno eval "console.log(JSON.stringify(Object.keys((await import('./scripts/env.ts')).build)))"
}

# ./tasks.sh report
task_report() {
  ./deno run --allow-all npm:playwright@1.51.1 show-report
}

# --- PREPARE ---
task_prepare() {
  if [ ! -f "./deno" ]; then
    echo "Installing deno"
    curl -SsfL https://marcisbee.github.io/gh/dl.sh | bash -s -- --repo denoland/deno --tag v2.2.6
  else
    echo "Found deno"
  fi

  ./deno --allow-all npm:playwright@1.51.1 install
}
