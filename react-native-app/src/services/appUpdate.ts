import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';

interface GithubReleaseAsset {
  name: string;
  browser_download_url: string;
  content_type?: string;
}

interface GithubRelease {
  tag_name: string;
  name: string;
  html_url: string;
  body: string;
  published_at: string;
  draft: boolean;
  prerelease: boolean;
  assets: GithubReleaseAsset[];
}

export interface AppUpdateCheckResult {
  isUpdateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseUrl: string;
  releaseNotes: string;
  assetName?: string;
  downloadUrl?: string;
}

function getGithubRepoConfig(): { owner: string; repo: string } {
  const owner = (process.env.EXPO_PUBLIC_GITHUB_OWNER ?? '').trim();
  const repo = (process.env.EXPO_PUBLIC_GITHUB_REPO ?? '').trim();

  if (!owner || !repo) {
    throw new Error('Missing GitHub update config. Set EXPO_PUBLIC_GITHUB_OWNER and EXPO_PUBLIC_GITHUB_REPO in your .env.');
  }

  return { owner, repo };
}

function normalizeVersion(input: string): string {
  const cleaned = input.trim().replace(/^v/i, '');
  const match = cleaned.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return '0.0.0';
  }
  return `${match[1]}.${match[2]}.${match[3]}`;
}

function compareVersions(versionA: string, versionB: string): number {
  const a = normalizeVersion(versionA).split('.').map((value) => Number(value));
  const b = normalizeVersion(versionB).split('.').map((value) => Number(value));

  for (let index = 0; index < 3; index += 1) {
    if (a[index] > b[index]) {
      return 1;
    }

    if (a[index] < b[index]) {
      return -1;
    }
  }

  return 0;
}

function pickApkAsset(assets: GithubReleaseAsset[]): GithubReleaseAsset | undefined {
  const apkAssets = assets.filter((asset) => asset.name.toLowerCase().endsWith('.apk'));
  if (apkAssets.length === 0) {
    return undefined;
  }

  return (
    apkAssets.find((asset) => /release|universal/i.test(asset.name)) ??
    apkAssets[0]
  );
}

function resolveCurrentVersion(): string {
  const nativeVersion = (Application.nativeApplicationVersion ?? '').trim();
  if (nativeVersion.length > 0) {
    return normalizeVersion(nativeVersion);
  }

  return '0.0.0';
}

export function getCurrentAppVersion(): string {
  return resolveCurrentVersion();
}

export function isUpdateConfigPresent(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_GITHUB_OWNER && process.env.EXPO_PUBLIC_GITHUB_REPO);
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unexpected update error.';
}

export async function checkForAppUpdate(): Promise<AppUpdateCheckResult> {
  if (Platform.OS !== 'android') {
    throw new Error('In-app APK updates are currently supported on Android only.');
  }

  const { owner, repo } = getGithubRepoConfig();
  const endpoint = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to load latest release (${response.status}). Make sure the repository and releases are public or accessible.`);
  }

  const release = (await response.json()) as GithubRelease;
  const latestVersion = normalizeVersion(release.tag_name || release.name);
  const currentVersion = resolveCurrentVersion();
  const apkAsset = pickApkAsset(release.assets ?? []);

  return {
    isUpdateAvailable: Boolean(apkAsset) && compareVersions(latestVersion, currentVersion) > 0,
    currentVersion,
    latestVersion,
    releaseName: release.name || release.tag_name,
    releaseUrl: release.html_url,
    releaseNotes: release.body || '',
    assetName: apkAsset?.name,
    downloadUrl: apkAsset?.browser_download_url
  };
}

export async function downloadAndInstallUpdate(
  update: AppUpdateCheckResult,
  onProgress?: (ratio: number) => void
): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('APK install flow is supported only on Android.');
  }

  if (!update.downloadUrl) {
    throw new Error('No APK asset was found in the latest GitHub release.');
  }

  const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!baseDir) {
    throw new Error('No writable directory is available for update download.');
  }

  const apkFileName = (update.assetName ?? `leaflens-${update.latestVersion}.apk`).replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileUri = `${baseDir}${apkFileName}`;

  await FileSystem.deleteAsync(fileUri, { idempotent: true });

  const download = FileSystem.createDownloadResumable(update.downloadUrl, fileUri, {}, (progress) => {
    const expected = progress.totalBytesExpectedToWrite;
    if (!onProgress || expected <= 0) {
      return;
    }

    onProgress(progress.totalBytesWritten / expected);
  });

  const result = await download.downloadAsync();
  if (!result?.uri) {
    throw new Error('Download failed before completion.');
  }

  const contentUri = await FileSystem.getContentUriAsync(result.uri);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    flags: 1 | 268435456,
    type: 'application/vnd.android.package-archive'
  });
}
