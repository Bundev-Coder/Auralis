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
