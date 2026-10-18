import os
import glob
import re

count = 0
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
            print(f"Patched: {p}")
            count += 1
    except Exception as e:
        print(f"Error patching {p}: {e}")

print(f"Total Swift packages patched: {count}")

# Also remove -quiet from expo-modules-jsi build-xcframework.sh for clear build logs
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
