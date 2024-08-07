#!/bin/bash
set -e

# Check if gum is installed
if ! command -v gum &>/dev/null; then
    echo "gum is not installed. Please install it with 'brew install gum'."
    exit 1
fi

root_dir=$(pwd)

# Function to check if Tika server is running
check_tika_server() {
    if nc -z localhost 9998 >/dev/null 2>&1; then
        return 0
    else
        gum style --foreground 196 "Error: Tika server is not running on port 9998."
        gum style --foreground 226 "Please start the Tika server before running the tests."
        gum style --foreground 226 "Run 'docker run -d -p 9998:9998 apache/tika' to start the Tika server."
        return 1
    fi
}

# Function to run a single test suite
run_test_suite() {
    local suite_name=$1
    local command=$2
    local exit_code

    gum style --border normal --border-foreground 99 --padding "1 2" --bold "$suite_name Tests"
    eval "$command"
    exit_code=$?
    cd "$root_dir"

    if [ $exit_code -eq 0 ]; then
        gum style --foreground 46 "$suite_name Tests: PASSED"
    else
        gum style --foreground 196 "$suite_name Tests: FAILED"
    fi

    return $exit_code
}

run_tests() {
    gum spin --spinner dot --title "Running tests..." -- sleep 1

    local test_suites=(
        "Backend Core:cd backend/core && tox -p auto"
        "Worker:cd backend && pytest worker"
        "API:cd backend && pytest api"
    )

    local all_passed=true
    local results=()

    for suite in "${test_suites[@]}"; do
        IFS=':' read -r suite_name suite_command <<< "$suite"
        if ! run_test_suite "$suite_name" "$suite_command"; then
            all_passed=false
        fi
        results+=("$suite_name:$?")
    done

    # Return overall exit code
    $all_passed
}

# Main execution
if check_tika_server; then
    run_tests
    exit $?
else
    exit 1
fi