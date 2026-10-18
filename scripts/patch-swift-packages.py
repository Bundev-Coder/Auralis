import os
import glob
import re
import tarfile
import io

print("=== Running patch-swift-packages.py ===")

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

# 2. Patch HostFunctionClosure.h to add static factory method for Swift C++ immortal reference
hfc_path = os.path.join("node_modules", "expo-modules-jsi", "apple", "Sources", "ExpoModulesJSI-Cxx", "include", "HostFunctionClosure.h")
if os.path.exists(hfc_path):
    try:
        with open(hfc_path, "r", encoding="utf-8") as f:
            hfc_code = f.read()
        if "static HostFunctionClosure *_Nonnull create" not in hfc_code:
            target = "explicit HostFunctionClosure(Context context, Closure closure, Deallocator deallocator) : RetainedSwiftPointer(context, deallocator), _closure(closure) {};"
            replacement = target + "\n\n  static HostFunctionClosure *_Nonnull create(Context context, Closure closure, Deallocator deallocator) {\n    return new HostFunctionClosure(context, closure, deallocator);\n  }"
            hfc_code_patched = hfc_code.replace(target, replacement)
            if hfc_code_patched != hfc_code:
                with open(hfc_path, "w", encoding="utf-8") as f:
                    f.write(hfc_code_patched)
                print("Patched HostFunctionClosure.h with static create factory method")
    except Exception as e:
        print(f"Error patching {hfc_path}: {e}")

# 3. Patch HostObjectCallbacks.h with appendPropNameId helper using C++ emplace_back for move-only PropNameID
hoc_path = os.path.join("node_modules", "expo-modules-jsi", "apple", "Sources", "ExpoModulesJSI-Cxx", "include", "HostObjectCallbacks.h")
if os.path.exists(hoc_path):
    try:
        with open(hoc_path, "r", encoding="utf-8") as f:
            hoc_code = f.read()
        if "appendPropNameId" not in hoc_code:
            target = "using PropNameIds = std::vector<facebook::jsi::PropNameID>;"
            replacement = target + """\n\n  static inline void appendPropNameId(PropNameIds &vec, facebook::jsi::IRuntime &runtime, const std::string &name) {
    vec.emplace_back(facebook::jsi::PropNameID::forUtf8(runtime, name));
  }"""
            hoc_code_patched = hoc_code.replace(target, replacement)
            hoc_code_patched = hoc_code_patched.replace(
                "} SWIFT_NONCOPYABLE; // class HostObjectCallbacks",
                """} SWIFT_NONCOPYABLE; // class HostObjectCallbacks

inline void appendPropNameId(HostObjectCallbacks::PropNameIds &vec, facebook::jsi::IRuntime &runtime, const std::string &name) {
  HostObjectCallbacks::appendPropNameId(vec, runtime, name);
}"""
            )
            if hoc_code_patched != hoc_code:
                with open(hoc_path, "w", encoding="utf-8") as f:
                    f.write(hoc_code_patched)
                print("Patched HostObjectCallbacks.h with appendPropNameId helper")
    except Exception as e:
        print(f"Error patching {hoc_path}: {e}")

# 4. Patch JSIUtils.h errorFromValue to take const reference avoiding SILGen crash in Swift 6.1
jsiu_path = os.path.join("node_modules", "expo-modules-jsi", "apple", "Sources", "ExpoModulesJSI-Cxx", "include", "JSIUtils.h")
if os.path.exists(jsiu_path):
    try:
        with open(jsiu_path, "r", encoding="utf-8") as f:
            jsiu_code = f.read()
        target = "inline jsi::JSError errorFromValue(jsi::IRuntime &runtime, jsi::Value value) {"
        replacement = "inline jsi::JSError errorFromValue(jsi::IRuntime &runtime, const jsi::Value &value) {\n  return jsi::JSError(runtime, jsi::Value(runtime, value));\n}\ninline jsi::JSError _orig_errorFromValue(jsi::IRuntime &runtime, jsi::Value value) {"
        if target in jsiu_code:
            jsiu_code_patched = jsiu_code.replace(target, replacement)
            with open(jsiu_path, "w", encoding="utf-8") as f:
                f.write(jsiu_code_patched)
            print("Patched JSIUtils.h errorFromValue to take const reference")
    except Exception as e:
        print(f"Error patching {jsiu_path}: {e}")

# 5. Patch prebuilt XCFramework tarballs in node_modules to downgrade Swift 6.3 compiler requirement to 6.1
# and replace unknown @_Concurrency.MainActor with @MainActor
count_tar = 0
for tar_path in glob.glob("node_modules/**/prebuilds/**/*.tar.gz", recursive=True):
    try:
        modified = False
        with tarfile.open(tar_path, "r:gz") as tar:
            members = tar.getmembers()
            new_tar_io = io.BytesIO()
            with tarfile.open(fileobj=new_tar_io, mode="w:gz") as new_tar:
                for member in members:
                    f = tar.extractfile(member)
                    if f is not None:
                        data = f.read()
                        if member.name.endswith(".swiftinterface"):
                            content = data.decode("utf-8", errors="ignore")
                            orig = content
                            content = content.replace("Apple Swift version 6.3.1 (swiftlang-6.3.1.1.2 clang-2100.0.123.102)", "Apple Swift version 6.1.2 (swiftlang-6.1.2.1.2 clang-1700.0.13.5)")
                            content = content.replace("Apple Swift version 6.3", "Apple Swift version 6.1.2")
                            content = content.replace("-interface-compiler-version 6.3.1", "-interface-compiler-version 6.1.2")
                            content = content.replace("-interface-compiler-version 6.3", "-interface-compiler-version 6.1.2")
                            content = content.replace("@_Concurrency.MainActor", "@MainActor")
                            content = content.replace("extension UIKit.UIView : @MainActor ExpoModulesCore.AnyArgument {", "extension UIKit.UIView : ExpoModulesCore.AnyArgument {")
                            content = content.replace("extension UIKit.UIView : @_Concurrency.MainActor ExpoModulesCore.AnyArgument {", "extension UIKit.UIView : ExpoModulesCore.AnyArgument {")
                            if content != orig:
                                modified = True
                                data = content.encode("utf-8")
                        member.size = len(data)
                        new_tar.addfile(member, io.BytesIO(data))
                    else:
                        new_tar.addfile(member)
        if modified:
            with open(tar_path, "wb") as f:
                f.write(new_tar_io.getvalue())
            print(f"Patched prebuild tarball: {tar_path}")
            count_tar += 1
    except Exception as e:
        print(f"Error patching tarball {tar_path}: {e}")

print(f"Total prebuild tarballs patched: {count_tar}")

# 6. Patch extracted .swiftinterface files in repo (e.g. in ios/Pods/ or XCFrameworks)
count_si = 0
all_si_files = set(glob.glob("**/*.swiftinterface", recursive=True) + glob.glob("ios/**/*.swiftinterface", recursive=True) + glob.glob("node_modules/**/*.swiftinterface", recursive=True))
for si_path in all_si_files:
    try:
        with open(si_path, "r", encoding="utf-8") as f:
            content = f.read()
        orig = content
        content = content.replace("Apple Swift version 6.3.1 (swiftlang-6.3.1.1.2 clang-2100.0.123.102)", "Apple Swift version 6.1.2 (swiftlang-6.1.2.1.2 clang-1700.0.13.5)")
        content = content.replace("Apple Swift version 6.3", "Apple Swift version 6.1.2")
        content = content.replace("-interface-compiler-version 6.3.1", "-interface-compiler-version 6.1.2")
        content = content.replace("-interface-compiler-version 6.3", "-interface-compiler-version 6.1.2")
        content = content.replace("@_Concurrency.MainActor", "@MainActor")
        content = content.replace("extension UIKit.UIView : @MainActor ExpoModulesCore.AnyArgument {", "extension UIKit.UIView : ExpoModulesCore.AnyArgument {")
        content = content.replace("extension UIKit.UIView : @_Concurrency.MainActor ExpoModulesCore.AnyArgument {", "extension UIKit.UIView : ExpoModulesCore.AnyArgument {")
        if content != orig:
            with open(si_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Patched standalone swiftinterface: {si_path}")
            count_si += 1
    except Exception as e:
        print(f"Error patching swiftinterface {si_path}: {e}")

print(f"Total standalone swiftinterfaces patched: {count_si}")

# 7. Patch Swift source files for Sendable conformance, weak var, Task.immediate, and C++ interop
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

        # Replace weak let with weak var
        code = re.sub(r"\bweak\s+let\b", "weak var", code)

        # Fix Task+immediate.swift (Task.immediate and name: parameter only exist in Swift 6.2+)
        if "Task+immediate.swift" in p:
            code = re.sub(
                r"if\s+#available\(.*?\)\s*\{[\s\S]*?\}\s*else\s*\{[\s\S]*?\}",
                "return Task(priority: .high, operation: operation)",
                code
            )

        # Fix JavaScriptRuntime.swift
        if "JavaScriptRuntime.swift" in p:
            # PropNameID is a move-only C++ type with deleted copy constructor.
            # Swift's vector.push_back calls the deleted copy constructor.
            # Replace with expo.HostObjectCallbacks.appendPropNameId using C++ emplace_back.
            code = re.sub(
                r"for\s+propertyName\s+in\s+propertyNames\s*\{[\s\S]*?vector\.push_back\([^\)]*\)\s*\}",
                """for propertyName in propertyNames {
        expo.HostObjectCallbacks.appendPropNameId(&vector, iRuntime, std.string(propertyName))
      }""",
                code
            )
            # Fix immortal reference constructor call via static factory
            code = code.replace(
                "expo.HostFunctionClosure(context, call, deallocate)",
                "expo.HostFunctionClosure.create(context, call, deallocate)"
            )

        # Fix JavaScriptError.swift SILGen crash in Swift 6.1 (Xcode 16.4)
        if "JavaScriptError.swift" in p:
            code = code.replace(
                "public init(_ runtime: JavaScriptRuntime, value: consuming JavaScriptValue)",
                "public init(_ runtime: JavaScriptRuntime, value: borrowing JavaScriptValue)"
            )

        if code != orig:
            with open(p, "w", encoding="utf-8") as f:
                f.write(code)
            print(f"Patched Swift source file: {p}")
            count_swift += 1
    except Exception as e:
        print(f"Error patching {p}: {e}")

print(f"Total Swift source files patched: {count_swift}")

# 8. Remove -quiet from expo-modules-jsi build-xcframework.sh for clear build logs
bf_path = os.path.join("node_modules", "expo-modules-jsi", "apple", "scripts", "build-xcframework.sh")
if os.path.exists(bf_path):
    try:
        with open(bf_path, "r", encoding="utf-8") as f:
            bf_code = f.read()
        bf_code_patched = bf_code.replace("-quiet \\\n", "")
        if bf_code_patched != bf_code:
            with open(bf_path, "w", encoding="utf-8") as f:
                f.write(bf_code_patched)
            print("Patched build-xcframework.sh to remove -quiet")
    except Exception as e:
        print(f"Error patching {bf_path}: {e}")

print("=== Patching completed successfully ===")
