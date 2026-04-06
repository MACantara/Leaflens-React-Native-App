import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { analyzeAndSaveLeaf, analyzeLeaf } from '../api/leaves';
import { ApiError } from '../api/client';
import { LeafAnalysisResponse, Session } from '../types/models';

interface AnalyzeScreenProps {
  session?: Session;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unexpected error.';
}

function renderResult(result: LeafAnalysisResponse, imageUri: string, resultImageHeight: number): React.JSX.Element {
  return (
    <View style={styles.resultCard}>
      <Image source={{ uri: imageUri }} style={[styles.resultImage, { height: resultImageHeight }]} />
      <Text style={styles.resultTitle}>{result.commonName || 'N/A'}</Text>
      <Text style={styles.resultScientific}>{result.scientificName || 'N/A'}</Text>

      <Text style={styles.sectionTitle}>Origin</Text>
      <Text style={styles.sectionBody}>{result.origin || 'N/A'}</Text>

      <Text style={styles.sectionTitle}>Uses</Text>
      <Text style={styles.sectionBody}>{result.uses || 'N/A'}</Text>

      <Text style={styles.sectionTitle}>Habitat</Text>
      <Text style={styles.sectionBody}>{result.habitat || 'N/A'}</Text>
    </View>
  );
}

export function AnalyzeScreen({ session }: AnalyzeScreenProps): React.JSX.Element {
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LeafAnalysisResponse | undefined>();
  const { height: viewportHeight } = useWindowDimensions();

  const previewHeight = Math.max(220, Math.min(420, Math.round(viewportHeight * 0.4)));
  const resultImageHeight = Math.max(180, Math.min(280, Math.round(previewHeight * 0.64)));

  function handleImageSelection(uri: string): void {
    setImageUri(uri);
    setResult(undefined);
    setError('');
  }

  async function pickFromLibrary(): Promise<void> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo library access to continue.');
      return;
    }

    const selection = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsMultipleSelection: false
    });

    if (selection.canceled || selection.assets.length === 0) {
      return;
    }

    handleImageSelection(selection.assets[0].uri);
  }

  async function openCamera(): Promise<void> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow camera access to take a photo.');
      return;
    }

    const capture = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false
    });

    if (capture.canceled || capture.assets.length === 0) {
      return;
    }

    handleImageSelection(capture.assets[0].uri);
  }

  function openSourcePicker(): void {
    Alert.alert('Select Image Source', 'Use your camera or choose from your photos.', [
      {
        text: 'Take Photo',
        onPress: () => {
          void openCamera();
        }
      },
      {
        text: 'Choose from Library',
        onPress: () => {
          void pickFromLibrary();
        }
      },
      {
        text: 'Cancel',
        style: 'cancel'
      }
    ]);
  }

  async function runAnalysis(): Promise<void> {
    if (!imageUri) {
      setError('Select an image first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (session) {
        const response = await analyzeAndSaveLeaf(imageUri, session.userId, session.token);
        setResult(response.analysis);
      } else {
        const analysis = await analyzeLeaf(imageUri);
        setResult(analysis);
      }
    } catch (analyzeError) {
      setError(getErrorMessage(analyzeError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.previewWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={[styles.preview, { height: previewHeight }]} />
        ) : (
          <View style={[styles.previewPlaceholder, { height: previewHeight }]}>
            <MaterialCommunityIcons name="leaf" size={58} color="#a3a3a3" />
            <Text style={styles.previewText}>Capture a leaf photo to begin</Text>
          </View>
        )}
      </View>

      <View style={styles.controlRow}>
        <Pressable style={styles.controlButton} onPress={openSourcePicker}>
          <Feather name="refresh-cw" size={25} color="#f4f4f4" />
        </Pressable>
        <Pressable style={styles.captureButton} onPress={() => void openCamera()}>
          <View style={styles.captureCircle} />
        </Pressable>
        <Pressable style={styles.controlButton} onPress={runAnalysis} disabled={loading}>
          <MaterialCommunityIcons name="leaf" size={25} color="#f4f4f4" />
        </Pressable>
      </View>

      {loading && <Text style={styles.helperText}>Analyzing image...</Text>}

      {!session && <Text style={styles.helperText}>Sign in to save every successful analysis to your history.</Text>}

      {error.length > 0 && <Text style={styles.errorText}>{error}</Text>}
      {result && imageUri && renderResult(result, imageUri, resultImageHeight)}
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
    paddingTop: 8,
    paddingBottom: 24,
    gap: 14
  },
  previewWrap: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#d1d5db'
  },
  preview: {
    width: '100%'
  },
  previewPlaceholder: {
    width: '100%',
    backgroundColor: '#d6d3d1',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  previewText: {
    color: '#52525b',
    fontSize: 16
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#a3cb4f',
    borderRadius: 18,
    paddingVertical: 12
  },
  controlButton: {
    width: 84,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#95bf3f',
    alignItems: 'center',
    justifyContent: 'center'
  },
  captureButton: {
    width: 84,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#d2e59d',
    alignItems: 'center',
    justifyContent: 'center'
  },
  captureCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#ffffff'
  },
  helperText: {
    color: '#4b5563'
  },
  errorText: {
    color: '#dc2626'
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    gap: 8
  },
  resultImage: {
    width: '100%',
    height: 280,
    borderRadius: 20,
    backgroundColor: '#e5e7eb'
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f0f0f'
  },
  resultScientific: {
    color: '#4b5563',
    fontSize: 16
  },
  sectionTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f0f0f'
  },
  sectionBody: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 22
  }
});
