import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const SUPPORTED_JAVA_MAJORS = new Set([17, 21]);

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

  runExpoAndroid(env);
}

main();
