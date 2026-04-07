import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { exploreLeaves, getLeafImageSource, saveExploreLeaf } from '../api/leaves';
import { ApiError } from '../api/client';
import { LeafItem, Session } from '../types/models';
import { usePullToRefreshController } from '../utils/mobileGestures';
import { Feather } from '@expo/vector-icons';

interface ExploreScreenProps {
  session?: Session;
  preselectedTag?: string;
  preselectedTagVersion?: number;
  globalSearchKeyword?: string;
  globalSearchTags?: string[];
  globalSearchVersion?: number;
}

function errorToText(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unexpected error.';
}

function normalizeSearchText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeTagList(tags: string[]): string[] {
  const seen = new Set<string>();

  return tags
    .map((tag) => normalizeSearchText(tag))
    .filter((tag) => tag.length > 0)
    .filter((tag) => {
      if (seen.has(tag)) {
        return false;
      }

      seen.add(tag);
      return true;
    });
}

function matchesLeafKeyword(leaf: LeafItem, keyword: string): boolean {
  if (!keyword) {
    return true;
  }

  const searchableValues = [
    leaf.commonName,
    leaf.scientificName,
    leaf.origin,
    leaf.usage,
    leaf.medicinalUses,
    leaf.habitat,
    leaf.careTips,
    leaf.safetyNotes,
    leaf.identificationNotes,
    ...(leaf.keyCharacteristics ?? []),
    ...(leaf.tags ?? []),
    ...(leaf.medicalConditions ?? [])
  ];

  return searchableValues.some((value) => normalizeSearchText(value).includes(keyword));
}

function matchesLeafTags(leaf: LeafItem, selectedTags: string[]): boolean {
  if (selectedTags.length === 0) {
    return true;
  }

  const leafTags = new Set((leaf.tags ?? []).map((tag) => normalizeSearchText(tag)).filter((tag) => tag.length > 0));
  return selectedTags.some((tag) => leafTags.has(tag));
}

function filterLeavesLocally(leaves: LeafItem[], rawKeyword: string, rawTags: string[]): LeafItem[] {
  const keyword = normalizeSearchText(rawKeyword);
  const tags = normalizeTagList(rawTags);

  return leaves.filter((leaf) => matchesLeafKeyword(leaf, keyword) && matchesLeafTags(leaf, tags));
}

export function ExploreScreen({
  session,
  preselectedTag,
  preselectedTagVersion,
  globalSearchKeyword,
  globalSearchTags,
  globalSearchVersion
}: ExploreScreenProps): React.JSX.Element {
  const [keyword, setKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [items, setItems] = useState<LeafItem[]>([]);
  const [error, setError] = useState('');
  const [savingLeafId, setSavingLeafId] = useState<number | undefined>();
  const { loading, refreshing, runInitialLoad, runPullToRefresh } = usePullToRefreshController();

  const fetchExplore = useCallback(
    async (nextKeyword: string, nextTags: string[]): Promise<void> => {
      if (!session) {
        setItems([]);
        return;
      }

      setError('');

      try {
        const allLeaves = await exploreLeaves(session.token);
        const filteredLeaves = filterLeavesLocally(allLeaves, nextKeyword, nextTags);
        setItems(filteredLeaves);
      } catch (loadError) {
        setError(errorToText(loadError));
      }
    },
    [session]
  );

  const loadExploreData = useCallback(async (): Promise<void> => {
    await fetchExplore(keyword, selectedTags);
  }, [fetchExplore, keyword, selectedTags]);

  async function onSaveLeaf(leafId: number): Promise<void> {
    if (!session) {
      setError('Login to save leaves to your collection.');
      return;
    }

    setSavingLeafId(leafId);
    setError('');

    try {
      await saveExploreLeaf(leafId, session.userId, session.token);
    } catch (saveError) {
      setError(errorToText(saveError));
    } finally {
      setSavingLeafId(undefined);
    }
  }

  useEffect(() => {
    void runInitialLoad(async () => {
      await fetchExplore('', []);
    });
  }, [fetchExplore, runInitialLoad, session?.token]);

  useEffect(() => {
    if (!preselectedTag) {
      return;
    }

    const normalized = preselectedTag.trim().toLowerCase();
    if (!normalized) {
      return;
    }

    setKeyword(normalized);
    setSelectedTags([]);
    void runInitialLoad(async () => {
      await fetchExplore(normalized, []);
    });
  }, [fetchExplore, preselectedTag, preselectedTagVersion, runInitialLoad]);

  useEffect(() => {
    if (globalSearchVersion === undefined) {
      return;
    }

    const normalizedKeyword = (globalSearchKeyword ?? '').trim();
    const normalizedTags = globalSearchTags ?? [];
    setKeyword(normalizedKeyword);
    setSelectedTags(normalizedTags);
    void runInitialLoad(async () => {
      await fetchExplore(normalizedKeyword, normalizedTags);
    });
  }, [fetchExplore, globalSearchKeyword, globalSearchTags, globalSearchVersion, runInitialLoad]);

  return (
    <View style={styles.root}>
      {loading && <Text style={styles.helperText}>Loading leaves...</Text>}
      {error.length > 0 && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.leafId)}
        contentContainerStyle={styles.listContent}
        onRefresh={() => {
          void runPullToRefresh(loadExploreData);
        }}
        refreshing={refreshing}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.imageFilename || item.imageContentType || item.imageSize ? (
              <ImageBackground source={getLeafImageSource(item.leafId, session?.token ?? '')} imageStyle={styles.leafImage} style={styles.leafImageWrap}>
                <View style={styles.imageOverlay} />
              </ImageBackground>
            ) : (
              <View style={styles.leafImagePlaceholder}>
                <Text style={styles.leafImagePlaceholderText}>No image available</Text>
              </View>
            )}

            <Text style={styles.leafTitle}>{item.commonName || 'Unknown'}</Text>
            <Text style={styles.leafMetaValue}>{item.scientificName || 'N/A'}</Text>
            {Array.isArray(item.medicalConditions) && item.medicalConditions.length > 0 ? (
              <Text style={styles.medicalHintText}>May help with: {item.medicalConditions.join(', ')}</Text>
            ) : item.medicinalUses && item.medicinalUses.trim().length > 0 && item.medicinalUses.trim().toLowerCase() !== 'n/a' ? (
              <Text style={styles.medicalHintText}>Medicinal use: {item.medicinalUses.trim()}</Text>
            ) : null}

            {session && item.ownerUserId === session.userId ? (
              <View style={styles.ownerButton}>
                <Feather name="check-circle" size={16} color="#14532d" />
                <Text style={styles.ownerButtonLabel}>You own this image</Text>
              </View>
            ) : (
              <Pressable
                style={[styles.saveButton, savingLeafId === item.leafId && styles.saveButtonDisabled]}
                onPress={() => onSaveLeaf(item.leafId)}
                disabled={savingLeafId === item.leafId}
              >
                <Text style={styles.saveButtonLabel}>
                  {savingLeafId === item.leafId ? 'Saving...' : 'Save to Collection'}
                </Text>
              </Pressable>
            )}
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.helperText}>No leaves found.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ece1dd',
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 10
  },
  listContent: {
    gap: 12,
    paddingTop: 2,
    paddingBottom: 22
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    gap: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2
  },
  leafImageWrap: {
    width: '100%',
    height: 210,
    marginBottom: 8
  },
  leafImage: {
    width: '100%',
    height: 210,
    borderRadius: 14,
    backgroundColor: '#d1d5db'
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    backgroundColor: 'rgba(17, 24, 39, 0.08)'
  },
  leafImagePlaceholder: {
    width: '100%',
    height: 210,
    borderRadius: 14,
    backgroundColor: '#e6dfdb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  leafImagePlaceholderText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600'
  },
  leafTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6
  },
  leafMetaValue: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 20
  },
  medicalHintText: {
    marginTop: 6,
    color: '#0f766e',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600'
  },
  saveButton: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: '#8bc34a',
    alignItems: 'center',
    paddingVertical: 12
  },
  saveButtonDisabled: {
    backgroundColor: '#b4c694'
  },
  saveButtonLabel: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700'
  },
  ownerButton: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12
  },
  ownerButtonLabel: {
    color: '#14532d',
    fontSize: 14,
    fontWeight: '700'
  },
  helperText: {
    color: '#4b5563',
    paddingHorizontal: 4
  },
  errorText: {
    color: '#dc2626',
    paddingHorizontal: 4
  }
});
