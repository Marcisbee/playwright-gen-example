#!/usr/bin/env bash

# ./tasks.sh test --grep="/pocketbase/"
task_test() {
  start_task prepare

  ./deno run --allow-all npm:playwright@1.51.1 test --trace=on "${@}"
}

# ./tasks.sh codegen --output="./todo-mvc-3.ts" https://demo.playwright.dev/todomvc
task_codegen() {
  start_task prepare

  # echo "${@}"
  ./deno run --allow-all npm:playwright@1.51.1 codegen --target="playwright-test" "${@}"
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
