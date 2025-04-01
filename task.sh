#!/usr/bin/env bash

# ./tasks.sh test --grep="/pocketbase/"
task_test() {
  PW_DISABLE_TS_ESM=1 ./deno run --allow-all npm:playwright@1.51.1 test --trace=on "${@}"
}

# ./tasks.sh codegen --output="./todo-mvc-3.ts" https://demo.playwright.dev/todomvc
task_codegen() {
  ./deno run --allow-all npm:playwright@1.51.1 codegen --target="playwright-test" "${@}"

  # Check if test was successful and if --output flag was provided along with --save-storage
  if [ $? -eq 0 ]; then
    output_file=""
    storage_path=""

    # Find the output file
    for arg in "${@}"; do
      if [[ $arg == *"--output="* ]]; then
        output_file="${arg#*=}"
      elif [[ $arg == *"--save-storage="* ]]; then
        storage_path="${arg#*=}"
      fi
    done

    # If both output file exists and --save-storage was provided
    if [ -n "$output_file" ] && [ -n "$storage_path" ] && [ -f "$output_file" ]; then
      # Insert storage state line before the last closing bracket
      sed -i '' '$s/});/  await page.context().storageState({ path: '"'$storage_path'"' });\n});/' "$output_file"
      echo "Updated output file: $output_file with storage state save to $storage_path"
    fi
  fi
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
