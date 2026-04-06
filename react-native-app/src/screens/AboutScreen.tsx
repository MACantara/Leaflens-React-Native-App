import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AppUpdateCheckResult,
  checkForAppUpdate,
  downloadAndInstallUpdate,
  getCurrentAppVersion,
  isUpdateConfigPresent,
  toErrorMessage
} from '../services/appUpdate';

interface AboutScreenProps {
  onNewPlant: () => void;
}

export function AboutScreen({ onNewPlant }: AboutScreenProps): React.JSX.Element {
  const [updateInfo, setUpdateInfo] = useState<AppUpdateCheckResult | undefined>();
  const [updateStatus, setUpdateStatus] = useState('Not checked yet.');
  const [updateError, setUpdateError] = useState('');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [installingUpdate, setInstallingUpdate] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | undefined>();

  const currentVersion = useMemo(() => getCurrentAppVersion(), []);

  async function onCheckUpdates(): Promise<void> {
    setCheckingUpdate(true);
    setUpdateError('');
    setDownloadProgress(undefined);

    try {
      const result = await checkForAppUpdate();
      setUpdateInfo(result);

      if (result.isUpdateAvailable) {
        setUpdateStatus(`Update available: ${result.latestVersion} (current: ${result.currentVersion})`);
        Alert.alert('Update Available', `Version ${result.latestVersion} is ready to install.`, [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Install',
            onPress: () => {
              void onInstallUpdate(result);
            }
          }
        ]);
      } else {
        setUpdateStatus(`You are up to date (${result.currentVersion}).`);
      }
    } catch (error) {
      setUpdateError(toErrorMessage(error));
    } finally {
      setCheckingUpdate(false);
    }
  }

  async function onInstallUpdate(overrideUpdateInfo?: AppUpdateCheckResult): Promise<void> {
    const targetUpdate = overrideUpdateInfo ?? updateInfo;
    if (!targetUpdate?.isUpdateAvailable) {
      return;
    }

    setInstallingUpdate(true);
    setUpdateError('');

    try {
      await downloadAndInstallUpdate(targetUpdate, (ratio) => {
        setDownloadProgress(ratio);
      });
      setUpdateStatus('Installer opened. Complete installation to update the app.');
    } catch (error) {
      setUpdateError(toErrorMessage(error));
    } finally {
      setInstallingUpdate(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>About Us</Text>

      <View style={styles.card}>
        <Text style={styles.heading}>LeafLens</Text>
        <Text style={styles.body}>
          LeafLens is your ultimate plant identification companion. Using advanced image recognition technology, we help
          you discover and learn about the plants around you.
        </Text>

        <Text style={styles.section}>Our Mission</Text>
        <Text style={styles.body}>
          To make plant identification accessible to everyone and promote environmental awareness through technology.
        </Text>

        <Text style={styles.section}>Features</Text>
        <Text style={styles.bullet}>• Instant plant identification</Text>
        <Text style={styles.bullet}>• Comprehensive plant database</Text>
        <Text style={styles.bullet}>• Detailed plant information</Text>
        <Text style={styles.bullet}>• History tracking</Text>
        <Text style={styles.bullet}>• User-friendly interface</Text>

        <Text style={styles.section}>App Updates</Text>
        <Text style={styles.body}>Current version: {currentVersion}</Text>
        <Text style={styles.body}>{updateStatus}</Text>

        {updateInfo?.isUpdateAvailable && (
          <Text style={styles.updateAvailableText}>Latest release: {updateInfo.releaseName || updateInfo.latestVersion}</Text>
        )}

        {!isUpdateConfigPresent() && (
          <Text style={styles.helperText}>
            Missing update config. Set EXPO_PUBLIC_GITHUB_OWNER and EXPO_PUBLIC_GITHUB_REPO in .env.
          </Text>
        )}

        {typeof downloadProgress === 'number' && downloadProgress > 0 && downloadProgress < 1 && (
          <Text style={styles.helperText}>Downloading update: {Math.round(downloadProgress * 100)}%</Text>
        )}

        {updateError.length > 0 && <Text style={styles.errorText}>{updateError}</Text>}

        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.secondaryButton, checkingUpdate && styles.disabledButton]}
            onPress={() => {
              void onCheckUpdates();
            }}
            disabled={checkingUpdate || installingUpdate}
          >
            <Text style={styles.secondaryButtonLabel}>{checkingUpdate ? 'Checking...' : 'CHECK UPDATES'}</Text>
          </Pressable>

          {updateInfo?.isUpdateAvailable && (
            <Pressable
              style={[styles.secondaryButton, installingUpdate && styles.disabledButton]}
              onPress={() => {
                void onInstallUpdate();
              }}
              disabled={checkingUpdate || installingUpdate}
            >
              <Text style={styles.secondaryButtonLabel}>{installingUpdate ? 'Preparing...' : 'INSTALL UPDATE'}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Pressable style={styles.primaryButton} onPress={onNewPlant}>
        <Text style={styles.primaryButtonLabel}>NEW PLANT</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ece1dd'
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 16
  },
  title: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3
  },
  heading: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800'
  },
  section: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8
  },
  body: {
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 27
  },
  bullet: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 24
  },
  helperText: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 20
  },
  updateAvailableText: {
    color: '#14532d',
    fontSize: 14,
    fontWeight: '600'
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    lineHeight: 20
  },
  buttonRow: {
    marginTop: 4,
    gap: 10
  },
  secondaryButton: {
    backgroundColor: '#dfeedd',
    borderRadius: 12,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14
  },
  secondaryButtonLabel: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '800'
  },
  disabledButton: {
    opacity: 0.6
  },
  primaryButton: {
    backgroundColor: '#8bc34a',
    borderRadius: 18,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButtonLabel: {
    color: '#f3fff0',
    fontSize: 18,
    fontWeight: '700'
  }
});
