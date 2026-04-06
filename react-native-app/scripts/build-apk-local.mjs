import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const args = new Set(process.argv.slice(2));
const shouldClean = args.has('--clean') || (!args.has('--no-clean') && !args.has('--gradle-only'));
const gradleOnly = args.has('--gradle-only');

const projectRoot = process.cwd();
const androidDir = path.join(projectRoot, 'android');

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

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

function resolveJava17Home() {
  const candidates = [
    process.env.JAVA_HOME_17_X64,
    '/usr/lib/jvm/java-17-openjdk-amd64',
    '/usr/lib/jvm/java-17-openjdk',
    '/usr/lib/jvm/temurin-17-jdk-amd64',
    '/usr/lib/jvm/temurin-17-jdk'
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(path.join(candidate, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')));
}

function withPreferredJavaEnv(baseEnv) {
  const env = { ...baseEnv };
  const resolvedJava17 = resolveJava17Home();

  if (resolvedJava17) {
    env.JAVA_HOME = resolvedJava17;
    env.PATH = `${path.join(resolvedJava17, 'bin')}${path.delimiter}${env.PATH ?? ''}`;
    return env;
  }

  const current = runCapture('java', ['-version'], { env });
  const combined = `${current.stdout ?? ''}\n${current.stderr ?? ''}`;
  const currentMajor = parseJavaMajor(combined);

  if (typeof currentMajor === 'number' && currentMajor >= 22) {
    console.error('Local Android build requires Java 17 (or 21) for this Gradle/AGP setup.');
    console.error(`Detected Java ${currentMajor}. Install Java 17 and set JAVA_HOME, then rerun.`);
    process.exit(1);
  }

  return env;
}

const buildEnv = withPreferredJavaEnv({ ...process.env, CI: '1' });

if (!gradleOnly) {
  const prebuildArgs = ['expo', 'prebuild', '--platform', 'android'];
  if (shouldClean) {
    prebuildArgs.push('--clean');
  }

  console.log(`Generating Android native project (${shouldClean ? 'clean' : 'incremental'} mode)...`);
  run('npx', prebuildArgs, { cwd: projectRoot, env: buildEnv });
}

if (!existsSync(androidDir)) {
  console.error(`Android directory not found at ${androidDir}. Run without --gradle-only first.`);
  process.exit(1);
}

console.log('Building release APK...');
const gradleCommand = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
run(gradleCommand, [':app:assembleRelease', '-x', 'lint', '-x', 'test'], {
  cwd: androidDir,
  env: buildEnv
});

const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
if (existsSync(apkPath)) {
  console.log(`\nAPK ready: ${apkPath}`);
} else {
  console.warn('\nBuild finished but APK path was not found in expected location.');
}
