import os
import glob
import re

# 1. Patch Package.swift files for tools version and trailing commas
count_pkg = 0
for p in glob.glob("node_modules/**/Package.swift", recursive=True):
    try:
        with open(p, "r", encoding="utf-8") as f:
            code = f.read()
        orig = code
        # Update swift-tools-version to 6.0
        code = re.sub(r"swift-tools-version:\s*6\.[0-9]+", "swift-tools-version: 6.0", code)
        # Remove trailing commas before closing parentheses or brackets
        code = re.sub(r",(\s*[\)\]])", r"\1", code)
        if code != orig:
            with open(p, "w", encoding="utf-8") as f:
                f.write(code)
            print(f"Patched Package.swift: {p}")
            count_pkg += 1
    except Exception as e:
        print(f"Error patching {p}: {e}")

print(f"Total Swift packages patched: {count_pkg}")

# 2. Patch Sendable conformance and 'weak let' -> 'weak var' in Swift source files
count_swift = 0
for p in glob.glob("node_modules/**/*.swift", recursive=True):
    try:
        with open(p, "r", encoding="utf-8") as f:
            code = f.read()
        orig = code

        # In Swift 6, classes with mutable stored properties cannot conform to Sendable without @unchecked
        code = re.sub(r"class\s+JavaScriptCallback\s*:\s*Sendable", "class JavaScriptCallback: @unchecked Sendable", code)
        code = re.sub(r"class\s+JavaScriptError\s*:\s*Error\s*,\s*Sendable", "class JavaScriptError: Error, @unchecked Sendable", code)
        code = re.sub(r"class\s+SharedObjectRegistry\s*:\s*Sendable", "class SharedObjectRegistry: @unchecked Sendable", code)

        # Replace weak let runtime with nonisolated(unsafe) weak var
        code = re.sub(r"private\s+weak\s+(let|var)\s+runtime\s*:\s*JavaScriptRuntime\?", "nonisolated(unsafe) private weak var runtime: JavaScriptRuntime?", code)
        code = re.sub(r"private\s+weak\s+(let|var)\s+appContext\s*:\s*AppContext\?", "nonisolated(unsafe) private weak var appContext: AppContext?", code)

        # Fallback for any other weak let
        code = re.sub(r"\bweak\s+let\b", "weak var", code)

        if code != orig:
            with open(p, "w", encoding="utf-8") as f:
                f.write(code)
            print(f"Patched Swift source file: {p}")
            count_swift += 1
    except Exception as e:
        print(f"Error patching {p}: {e}")

print(f"Total Swift source files patched: {count_swift}")

# 3. Also remove -quiet from expo-modules-jsi build-xcframework.sh for clear build logs
bf_path = os.path.join("node_modules", "expo-modules-jsi", "apple", "scripts", "build-xcframework.sh")
if os.path.exists(bf_path):
    try:
        with open(bf_path, "r", encoding="utf-8") as f:
            bf_code = f.read()
        bf_code_patched = bf_code.replace("-quiet \\\n", "")
        if bf_code_patched != bf_code:
            with open(bf_path, "w", encoding="utf-8") as f:
                f.write(bf_code_patched)
            print(f"Patched build-xcframework.sh to remove -quiet")
    except Exception as e:
        print(f"Error patching {bf_path}: {e}")
