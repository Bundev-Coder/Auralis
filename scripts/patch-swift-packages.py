import os
import glob
import re
import tarfile
import io

print("=== Running patch-swift-packages.py ===")

# Legacy Expo headers required by older modules (e.g. expo-av) but omitted in Expo SDK 58
LEGACY_HEADERS = {
    "EXEventEmitter.h": b"""// Copyright 2018-present 650 Industries. All rights reserved.
#pragma once
#import <Foundation/Foundation.h>

@protocol EXEventEmitter <NSObject>
- (NSArray<NSString *> *)supportedEvents;
- (void)startObserving;
- (void)stopObserving;
@end
""",
    "EXEventEmitterService.h": b"""// Copyright 2018-present 650 Industries. All rights reserved.
#pragma once
#import <Foundation/Foundation.h>

@protocol EXEventEmitterService <NSObject>
- (void)sendEventWithName:(NSString *)name body:(id)body;
@end
""",
    "EXLegacyExpoViewProtocol.h": b"""// Copyright 2015-present 650 Industries. All rights reserved.
#pragma once
#import <Foundation/Foundation.h>

@protocol EXLegacyExpoViewProtocol <NSObject>
@end
"""
}

# Legacy macros required by legacy modules (EXFatal, EXErrorWithMessage, EXLog*)
LEGACY_MACROS = """
#ifndef EXErrorWithMessage
#define EXErrorWithMessage(msg) [NSError errorWithDomain:@"expo" code:0 userInfo:@{NSLocalizedDescriptionKey: (msg)}]
#endif

#ifndef EXFatal
#define EXFatal(error) NSLog(@"[Expo Fatal Error] %@", (error))
#endif

#ifndef EXLogInfo
#define EXLogInfo(format, ...) NSLog((@"[Expo Info] " format), ##__VA_ARGS__)
#endif

#ifndef EXLogWarn
#define EXLogWarn(format, ...) NSLog((@"[Expo Warning] " format), ##__VA_ARGS__)
#endif

#ifndef EXLogError
#define EXLogError(format, ...) NSLog((@"[Expo Error] " format), ##__VA_ARGS__)
#endif

#ifndef EXPromiseResolveBlock_DEFINED
#define EXPromiseResolveBlock_DEFINED 1
typedef void (^EXPromiseResolveBlock)(id result);
typedef void (^EXPromiseRejectBlock)(NSString *code, NSString *message, NSError *error);
typedef void (^UMPromiseResolveBlock)(id result);
typedef void (^UMPromiseRejectBlock)(NSString *code, NSString *message, NSError *error);
#endif
"""

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

# 5. Patch prebuilt XCFramework tarballs in node_modules to downgrade Swift 6.3 compiler requirement to 6.1,
# replace unknown @_Concurrency.MainActor with @MainActor, and inject missing legacy Expo headers & defines.
count_tar = 0
for tar_path in glob.glob("node_modules/**/prebuilds/**/*.tar.gz", recursive=True):
    try:
        modified = False
        is_expo_modules_core = "ExpoModulesCore" in tar_path
        with tarfile.open(tar_path, "r:gz") as tar:
            members = tar.getmembers()
            existing_names = {m.name for m in members}
            header_dirs = set()
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

                        if is_expo_modules_core:
                            if member.name.endswith(".h"):
                                header_dirs.add(os.path.dirname(member.name).replace("\\", "/"))

                            if member.name.endswith("ExpoModulesCore_umbrella.h"):
                                content = data.decode("utf-8", errors="ignore")
                                if "EXEventEmitter.h" not in content:
                                    content += '\n#import "EXEventEmitter.h"\n#import "EXEventEmitterService.h"\n#import "EXLegacyExpoViewProtocol.h"\n'
                                    data = content.encode("utf-8")
                                    modified = True

                            if member.name.endswith("ExpoModulesCore.h"):
                                content = data.decode("utf-8", errors="ignore")
                                if "EXEventEmitter.h" not in content:
                                    content += '\n#import <ExpoModulesCore/EXEventEmitter.h>\n#import <ExpoModulesCore/EXEventEmitterService.h>\n#import <ExpoModulesCore/EXLegacyExpoViewProtocol.h>\n'
                                    data = content.encode("utf-8")
                                    modified = True

                            if member.name.endswith("EXDefines.h"):
                                content = data.decode("utf-8", errors="ignore")
                                if "EXErrorWithMessage" not in content:
                                    content += LEGACY_MACROS
                                    data = content.encode("utf-8")
                                    modified = True

                        member.size = len(data)
                        new_tar.addfile(member, io.BytesIO(data))
                    else:
                        new_tar.addfile(member)

                # Inject legacy headers into all header directories inside ExpoModulesCore tarballs
                if is_expo_modules_core and header_dirs:
                    for hdir in header_dirs:
                        for fname, fbytes in LEGACY_HEADERS.items():
                            fpath = f"{hdir}/{fname}".replace("\\", "/")
                            if fpath not in existing_names:
                                ti = tarfile.TarInfo(name=fpath)
                                ti.size = len(fbytes)
                                ti.mtime = 1700000000
                                ti.mode = 0o644
                                new_tar.addfile(ti, io.BytesIO(fbytes))
                                modified = True
                                print(f"Injected {fname} into tarball dir {hdir}")

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
            code = re.sub(
                r"for\s+propertyName\s+in\s+propertyNames\s*\{[\s\S]*?vector\.push_back\([^\)]*\)\s*\}",
                """for propertyName in propertyNames {
        expo.HostObjectCallbacks.appendPropNameId(&vector, iRuntime, std.string(propertyName))
      }""",
                code
            )
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

        # Fix VideoViewModule.swift promise.resolver -> promise.legacyResolver
        if "VideoViewModule.swift" in p:
            code = code.replace("resolver: promise.resolver", "resolver: promise.legacyResolver")

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

# 9. Provide legacy Expo headers & defines in expo-modules-core directories
emc_dirs = [
    os.path.join("node_modules", "expo-modules-core", "ios"),
    os.path.join("node_modules", "expo-modules-core", "ios", "Legacy"),
    os.path.join("node_modules", "expo-modules-core", "ios", "Legacy", "Services"),
    os.path.join("node_modules", "expo-modules-core", "ios", "Legacy", "Protocols"),
    os.path.join("node_modules", "expo-modules-core", "ios", "ExpoModulesCore"),
]
for d in emc_dirs:
    if os.path.exists(d):
        for fname, fbytes in LEGACY_HEADERS.items():
            fpath = os.path.join(d, fname)
            try:
                with open(fpath, "wb") as f:
                    f.write(fbytes)
                print(f"Wrote legacy header: {fpath}")
            except Exception as e:
                print(f"Error writing {fpath}: {e}")

exdef_path = os.path.join("node_modules", "expo-modules-core", "ios", "EXDefines.h")
if os.path.exists(exdef_path):
    try:
        with open(exdef_path, "r", encoding="utf-8") as f:
            exdef_code = f.read()
        if "EXErrorWithMessage" not in exdef_code:
            exdef_code += LEGACY_MACROS
            with open(exdef_path, "w", encoding="utf-8") as f:
                f.write(exdef_code)
            print("Patched EXDefines.h with legacy macros")
    except Exception as e:
        print(f"Error patching {exdef_path}: {e}")

# 10. Patch expo-av source files and provide fallback legacy headers & macros
av_dirs = [
    os.path.join("node_modules", "expo-av", "ios", "EXAV"),
    os.path.join("node_modules", "expo-av", "ios", "EXAV", "Video"),
]
for d in av_dirs:
    if os.path.exists(d):
        for fname, fbytes in LEGACY_HEADERS.items():
            fpath = os.path.join(d, fname)
            try:
                with open(fpath, "wb") as f:
                    f.write(fbytes)
                print(f"Wrote fallback header: {fpath}")
            except Exception as e:
                print(f"Error writing {fpath}: {e}")

# Inject legacy macros into expo-av ObjC sources
exav_src_files = [
    "EXAudioRecordingPermissionRequester.m",
    "EXAudioRecordingPermissionRequester.h",
    "EXAudioSessionManager.m",
    "EXAV.m",
    "EXAV.h",
    "EXAVPlayerData.m",
    "EXAVPlayerData.h",
    "EXAVTV.m",
    os.path.join("Video", "EXVideoView.h"),
    os.path.join("Video", "EXVideoView.m"),
]
for fname in exav_src_files:
    p = os.path.join("node_modules", "expo-av", "ios", "EXAV", fname)
    if os.path.exists(p):
        try:
            with open(p, "r", encoding="utf-8") as f:
                code = f.read()
            if "#define EXErrorWithMessage" not in code:
                # Insert right after the first #import or at top
                m = re.search(r"(#import[^\n]+\n)", code)
                if m:
                    idx = m.end()
                    code = code[:idx] + LEGACY_MACROS + "\n" + code[idx:]
                else:
                    code = LEGACY_MACROS + "\n" + code
                with open(p, "w", encoding="utf-8") as f:
                    f.write(code)
                print(f"Injected legacy macros into {p}")
        except Exception as e:
            print(f"Error injecting macros into {p}: {e}")

# Patch EXAV.h
exav_h = os.path.join("node_modules", "expo-av", "ios", "EXAV", "EXAV.h")
if os.path.exists(exav_h):
    try:
        with open(exav_h, "r", encoding="utf-8") as f:
            code = f.read()
        code_patched = code.replace(
            "#import <ExpoModulesCore/EXEventEmitter.h>",
            """#if __has_include(<ExpoModulesCore/EXEventEmitter.h>)
#import <ExpoModulesCore/EXEventEmitter.h>
#else
#import "EXEventEmitter.h"
#endif"""
        )
        if code_patched != code:
            with open(exav_h, "w", encoding="utf-8") as f:
                f.write(code_patched)
            print("Patched EXAV.h with conditional EXEventEmitter import")
    except Exception as e:
        print(f"Error patching {exav_h}: {e}")

# Patch EXAV.m and EXAVTV.m
for m_path in [
    os.path.join("node_modules", "expo-av", "ios", "EXAV", "EXAV.m"),
    os.path.join("node_modules", "expo-av", "ios", "EXAV", "EXAVTV.m"),
]:
    if os.path.exists(m_path):
        try:
            with open(m_path, "r", encoding="utf-8") as f:
                code = f.read()
            code_patched = code.replace(
                "#import <ExpoModulesCore/EXEventEmitterService.h>",
                """#if __has_include(<ExpoModulesCore/EXEventEmitterService.h>)
#import <ExpoModulesCore/EXEventEmitterService.h>
#else
#import "EXEventEmitterService.h"
#endif"""
            )
            code_patched = code_patched.replace("UMPromiseResolveBlock", "EXPromiseResolveBlock")
            code_patched = code_patched.replace("UMPromiseRejectBlock", "EXPromiseRejectBlock")
            if code_patched != code:
                with open(m_path, "w", encoding="utf-8") as f:
                    f.write(code_patched)
                print(f"Patched {m_path} with conditional EXEventEmitterService import and EXPromise types")
        except Exception as e:
            print(f"Error patching {m_path}: {e}")

# Patch Video/EXVideoView.h
vv_h = os.path.join("node_modules", "expo-av", "ios", "EXAV", "Video", "EXVideoView.h")
if os.path.exists(vv_h):
    try:
        with open(vv_h, "r", encoding="utf-8") as f:
            code = f.read()
        code_patched = code.replace(
            "#import <ExpoModulesCore/EXLegacyExpoViewProtocol.h>",
            """#if __has_include(<ExpoModulesCore/EXLegacyExpoViewProtocol.h>)
#import <ExpoModulesCore/EXLegacyExpoViewProtocol.h>
#else
#import "EXLegacyExpoViewProtocol.h"
#endif"""
        )
        if code_patched != code:
            with open(vv_h, "w", encoding="utf-8") as f:
                f.write(code_patched)
            print("Patched EXVideoView.h with conditional EXLegacyExpoViewProtocol import")
    except Exception as e:
        print(f"Error patching {vv_h}: {e}")

# Patch VideoViewModule.swift
vvm_path = os.path.join("node_modules", "expo-av", "ios", "EXAV", "Video", "VideoViewModule.swift")
if os.path.exists(vvm_path):
    try:
        with open(vvm_path, "r", encoding="utf-8") as f:
            code = f.read()
        code_patched = code.replace("resolver: promise.resolver", "resolver: promise.legacyResolver")
        if code_patched != code:
            with open(vvm_path, "w", encoding="utf-8") as f:
                f.write(code_patched)
            print("Patched VideoViewModule.swift to use promise.legacyResolver")
    except Exception as e:
        print(f"Error patching {vvm_path}: {e}")

# 11. Patch ios/Pods for post-pod run
if os.path.exists("ios"):
    for root, dirs, files in os.walk("ios"):
        r_norm = root.replace("\\", "/")
        if "ExpoModulesCore" in r_norm and (r_norm.endswith("Headers") or r_norm.endswith("Headers/ExpoModulesCore") or "ExpoModulesCore.framework/Headers" in r_norm):
            for fname, fbytes in LEGACY_HEADERS.items():
                dest = os.path.join(root, fname)
                try:
                    with open(dest, "wb") as f:
                        f.write(fbytes)
                    print(f"Wrote {fname} into Pods header dir: {dest}")
                except Exception as e:
                    print(f"Error writing to Pods {dest}: {e}")

        for f in files:
            if f == "ExpoModulesCore_umbrella.h":
                p = os.path.join(root, f)
                try:
                    with open(p, "r", encoding="utf-8") as hf:
                        ucode = hf.read()
                    if "EXEventEmitter.h" not in ucode:
                        ucode += '\n#import "EXEventEmitter.h"\n#import "EXEventEmitterService.h"\n#import "EXLegacyExpoViewProtocol.h"\n'
                        with open(p, "w", encoding="utf-8") as hf:
                            hf.write(ucode)
                        print(f"Patched Pods umbrella header: {p}")
                except Exception as e:
                    print(f"Error patching {p}: {e}")

            elif f == "ExpoModulesCore.h":
                p = os.path.join(root, f)
                try:
                    with open(p, "r", encoding="utf-8") as hf:
                        ucode = hf.read()
                    if "EXEventEmitter.h" not in ucode:
                        ucode += '\n#import <ExpoModulesCore/EXEventEmitter.h>\n#import <ExpoModulesCore/EXEventEmitterService.h>\n#import <ExpoModulesCore/EXLegacyExpoViewProtocol.h>\n'
                        with open(p, "w", encoding="utf-8") as hf:
                            hf.write(ucode)
                        print(f"Patched Pods ExpoModulesCore.h: {p}")
                except Exception as e:
                    print(f"Error patching {p}: {e}")

            elif f == "EXDefines.h":
                p = os.path.join(root, f)
                try:
                    with open(p, "r", encoding="utf-8") as hf:
                        ucode = hf.read()
                    if "EXErrorWithMessage" not in ucode:
                        ucode += LEGACY_MACROS
                        with open(p, "w", encoding="utf-8") as hf:
                            hf.write(ucode)
                        print(f"Patched Pods EXDefines.h: {p}")
                except Exception as e:
                    print(f"Error patching {p}: {e}")

# Patch VideoViewModule.swift to bypass legacyResolver / legacyRejecter getters
for vvm_path in [
    os.path.join("node_modules", "expo-av", "ios", "EXAV", "Video", "VideoViewModule.swift"),
    os.path.join("ios", "Pods", "EXAV", "Video", "VideoViewModule.swift"),
]:
    if os.path.exists(vvm_path):
        try:
            with open(vvm_path, "r", encoding="utf-8") as f:
                code = f.read()
            old_call = "view.contentView.setFullscreen(value, resolver: promise.legacyResolver, rejecter: promise.legacyRejecter)"
            new_call = 'view.contentView.setFullscreen(value, resolver: { res in promise.resolve(res) }, rejecter: { code, desc, _ in promise.reject(code ?? "ERR", desc ?? "") })'
            if old_call in code:
                code = code.replace(old_call, new_call)
                with open(vvm_path, "w", encoding="utf-8") as f:
                    f.write(code)
                print(f"Patched {vvm_path} to direct promise closures")
        except Exception as e:
            print(f"Error patching {vvm_path}: {e}")

print("=== Patching completed successfully ===")
