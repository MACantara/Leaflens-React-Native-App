import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const SUPPORTED_JAVA_MAJORS = new Set([17, 21]);
const REQUIRED_NDK_VERSION = '27.1.12297006';

function runCapture(command, commandArgs, options = {}) {
  return spawnSync(command, commandArgs, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    ...options
  });
}

function parseJavaMajor(versionText) {
  const normalized = versionText.replace(/\r/g, '');
  const match = normalized.match(/version\s+"(\d+)(?:\.(\d+))?/i);
  if (!match) {
    return undefined;
  }

  const first = Number(match[1]);
  const second = match[2] ? Number(match[2]) : undefined;

  if (first === 1 && typeof second === 'number') {
    return second;
  }

  return first;
}

function escapeForGradleLocalProperties(value) {
  return value.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
}

function javaExecutableName() {
  return process.platform === 'win32' ? 'java.exe' : 'java';
}

function javacExecutableName() {
  return process.platform === 'win32' ? 'javac.exe' : 'javac';
}

function isSupportedJavaHome(candidate) {
  const javaBin = path.join(candidate, 'bin', javaExecutableName());
  const javacBin = path.join(candidate, 'bin', javacExecutableName());
  if (!existsSync(javaBin) || !existsSync(javacBin)) {
    return false;
  }

  const version = runCapture(javaBin, ['-version']);
  const combined = `${version.stdout ?? ''}\n${version.stderr ?? ''}`;
  const major = parseJavaMajor(combined);
  return typeof major === 'number' && SUPPORTED_JAVA_MAJORS.has(major);
}

function resolveCompatibleJavaHome() {
  const candidates = [
    process.env.JAVA_HOME_21_X64,
    process.env.JAVA_HOME_17_X64,
    process.env.JAVA_HOME,
    '/usr/lib/jvm/java-21-openjdk',
    '/usr/lib/jvm/java-21-openjdk-amd64',
    '/usr/lib/jvm/java-17-openjdk',
    '/usr/lib/jvm/java-17-openjdk-amd64',
    '/usr/lib/jvm/temurin-21-jdk',
    '/usr/lib/jvm/temurin-17-jdk',
    '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home',
    '/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.0.0-hotspot',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.0.0-hotspot'
  ].filter(Boolean);

  return candidates.find((candidate) => isSupportedJavaHome(candidate));
}

function hasJavacOnPath(env) {
  const result = runCapture('javac', ['-version'], { env });
  return result.status === 0;
}

function getCurrentJavaMajor(env) {
  const result = runCapture('java', ['-version'], { env });
  const combined = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  return parseJavaMajor(combined);
}

function printInstallHint(currentMajor, javacAvailable) {
  console.error('Android dev build requires JDK 17 or 21 for this Expo/Gradle setup.');

  if (typeof currentMajor === 'number') {
    console.error(`Detected Java ${currentMajor}.`);
  } else {
    console.error('Could not detect a usable Java runtime.');
  }

  if (!javacAvailable) {
    console.error('A JDK is required (javac was not found). You currently have a JRE-only setup.');
  }

  if (process.platform === 'linux') {
    let distro = '';
    try {
      const osRelease = readFileSync('/etc/os-release', 'utf8');
      const idMatch = osRelease.match(/^ID=(.+)$/m);
      distro = idMatch ? idMatch[1].replace(/"/g, '') : '';
    } catch {
      distro = '';
    }

    if (distro === 'fedora') {
      console.error('Install with: sudo dnf install java-21-openjdk-devel');
      console.error('Then set: export JAVA_HOME=/usr/lib/jvm/java-21-openjdk');
      return;
    }

    if (distro === 'ubuntu' || distro === 'debian') {
      console.error('Install with: sudo apt install openjdk-21-jdk');
      console.error('Then set JAVA_HOME to your JDK path and retry.');
      return;
    }

    console.error('Install JDK 17 or 21, set JAVA_HOME, then retry npm run android.');
    return;
  }

  if (process.platform === 'win32') {
    console.error('Install JDK 17 or 21 and set JAVA_HOME to that installation directory.');
    return;
  }

  console.error('Install JDK 17 or 21 and export JAVA_HOME before running npm run android.');
}

function sdkManagerName() {
  return process.platform === 'win32' ? 'sdkmanager.bat' : 'sdkmanager';
}

function sdkRootCandidates() {
  const home = process.env.HOME ?? '';
  const localAppData = process.env.LOCALAPPDATA ?? '';

  return [
    process.env.ANDROID_SDK_ROOT,
    process.env.ANDROID_HOME,
    home ? path.join(home, 'Android', 'Sdk') : undefined,
    home ? path.join(home, 'Library', 'Android', 'sdk') : undefined,
    localAppData ? path.join(localAppData, 'Android', 'Sdk') : undefined
  ].filter(Boolean);
}

function resolveSdkRoot() {
  const candidates = sdkRootCandidates();
  let bestCandidate;
  let bestScore = -1;

  candidates.forEach((candidate) => {
    const platformToolsDir = path.join(candidate, 'platform-tools');
    if (!existsSync(platformToolsDir)) {
      return;
    }

    let score = 10;

    const hasSdkManager = Boolean(resolveSdkManager(candidate));
    if (hasSdkManager) {
      score += 5;
    }

    if (existsSync(path.join(candidate, 'licenses'))) {
      score += 3;
    }

    if (hasRequiredNdkInstalled(candidate)) {
      score += 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  });

  return bestCandidate;
}

function resolveSdkManager(sdkRoot) {
  const name = sdkManagerName();

  const candidates = [
    path.join(sdkRoot, 'cmdline-tools', 'latest', 'bin', name),
    path.join(sdkRoot, 'cmdline-tools', 'bin', name),
    path.join(sdkRoot, 'tools', 'bin', name)
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

function hasAcceptedAndroidLicenses(sdkRoot) {
  const licenseDir = path.join(sdkRoot, 'licenses');
  const androidLicense = path.join(licenseDir, 'android-sdk-license');
  const ndkLicense = path.join(licenseDir, 'android-ndk-license');
  return existsSync(androidLicense) || existsSync(ndkLicense);
}

function hasRequiredNdkInstalled(sdkRoot) {
  return existsSync(path.join(sdkRoot, 'ndk', REQUIRED_NDK_VERSION));
}

function printSdkHint(sdkRoot, sdkManagerPath, licenseAccepted, ndkInstalled) {
  console.error('Android SDK setup is incomplete for this build.');
  console.error(`Resolved Android SDK root: ${sdkRoot}`);

  if (!sdkManagerPath) {
    console.error('Android Command-line Tools are missing (sdkmanager not found).');
    console.error('Install Android SDK Command-line Tools from Android Studio SDK Manager.');
  }

  if (!licenseAccepted) {
    console.error('Required Android SDK/NDK licenses are not accepted yet.');
  }

  if (!ndkInstalled) {
    console.error(`NDK ${REQUIRED_NDK_VERSION} is not installed under this SDK root.`);
  }

  if (sdkManagerPath) {
    console.error('Run these commands:');
    if (process.platform === 'win32') {
      console.error(`  set ANDROID_SDK_ROOT=${sdkRoot}`);
      console.error(`  "${sdkManagerPath}" --sdk_root="${sdkRoot}" --licenses`);
      console.error(`  "${sdkManagerPath}" --sdk_root="${sdkRoot}" "ndk;${REQUIRED_NDK_VERSION}"`);
    } else {
      console.error(`  export ANDROID_SDK_ROOT="${sdkRoot}"`);
      console.error(`  yes | "${sdkManagerPath}" --sdk_root="${sdkRoot}" --licenses`);
      console.error(`  "${sdkManagerPath}" --sdk_root="${sdkRoot}" "ndk;${REQUIRED_NDK_VERSION}"`);
    }
  } else {
    console.error('After installing cmdline-tools, accept licenses and install NDK via sdkmanager.');
  }
}

function prepareAndroidSdkEnv(env) {
  const sdkRoot = resolveSdkRoot();

  if (!sdkRoot) {
    console.error('Android SDK root was not found. Expected a path containing platform-tools.');
    console.error('Set ANDROID_SDK_ROOT (or ANDROID_HOME) to your Android SDK directory and retry.');
    process.exit(1);
  }

  const sdkManagerPath = resolveSdkManager(sdkRoot);
  const licenseAccepted = hasAcceptedAndroidLicenses(sdkRoot);
  const ndkInstalled = hasRequiredNdkInstalled(sdkRoot);

  env.ANDROID_SDK_ROOT = sdkRoot;
  env.ANDROID_HOME = sdkRoot;
  env.PATH = `${path.join(sdkRoot, 'platform-tools')}${path.delimiter}${env.PATH ?? ''}`;

  const localPropertiesPath = path.join(process.cwd(), 'android', 'local.properties');
  if (existsSync(path.dirname(localPropertiesPath))) {
    const escaped = escapeForGradleLocalProperties(sdkRoot);
    const localPropertiesContent = `sdk.dir=${escaped}${process.platform === 'win32' ? '\r\n' : '\n'}`;
    try {
      writeFileSync(localPropertiesPath, localPropertiesContent, 'utf8');
    } catch {
      // If writing fails, Gradle can still rely on env vars.
    }
  }

  if (!sdkManagerPath || !licenseAccepted || !ndkInstalled) {
    printSdkHint(sdkRoot, sdkManagerPath, licenseAccepted, ndkInstalled);
    process.exit(1);
  }
}

function runExpoAndroid(env) {
  const extraArgs = process.argv.slice(2);
  const result = spawnSync('npx', ['expo', 'run:android', ...extraArgs], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env
  });

  process.exit(result.status ?? 1);
}

function main() {
  const env = { ...process.env };
  const compatibleJavaHome = resolveCompatibleJavaHome();

  if (compatibleJavaHome) {
    env.JAVA_HOME = compatibleJavaHome;
    env.PATH = `${path.join(compatibleJavaHome, 'bin')}${path.delimiter}${env.PATH ?? ''}`;

    if (process.env.JAVA_HOME !== compatibleJavaHome) {
      console.log(`[LeafLens] Using JAVA_HOME=${compatibleJavaHome}`);
    }
  }

  const currentMajor = getCurrentJavaMajor(env);
  const javacAvailable = env.JAVA_HOME
    ? existsSync(path.join(env.JAVA_HOME, 'bin', javacExecutableName()))
    : hasJavacOnPath(env);

  if (typeof currentMajor !== 'number' || !SUPPORTED_JAVA_MAJORS.has(currentMajor) || !javacAvailable) {
    printInstallHint(currentMajor, javacAvailable);
    process.exit(1);
  }

  prepareAndroidSdkEnv(env);

  runExpoAndroid(env);
}

main();
