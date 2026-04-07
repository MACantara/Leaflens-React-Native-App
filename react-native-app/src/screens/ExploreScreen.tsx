import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { exploreLeaves, getLeafImageSource, saveExploreLeaf } from '../api/leaves';
import { ApiError } from '../api/client';
import { LeafItem, Session } from '../types/models';
import { usePullToRefreshController } from '../utils/mobileGestures';

interface ExploreScreenProps {
  session?: Session;
  preselectedTag?: string;
  preselectedTagVersion?: number;
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

export function ExploreScreen({ session, preselectedTag, preselectedTagVersion }: ExploreScreenProps): React.JSX.Element {
  const [keyword, setKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [items, setItems] = useState<LeafItem[]>([]);
  const [error, setError] = useState('');
  const [savingLeafId, setSavingLeafId] = useState<number | undefined>();
  const { loading, refreshing, runInitialLoad, runPullToRefresh } = usePullToRefreshController();

  const loadExploreData = useCallback(async (): Promise<void> => {
    if (!session) {
      setItems([]);
      return;
    }

    setError('');

    try {
      const results = await exploreLeaves(session.token, keyword.trim() || undefined, selectedTags);
      setItems(results);
    } catch (loadError) {
      setError(errorToText(loadError));
    }
  }, [keyword, selectedTags, session]);

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
    void runInitialLoad(loadExploreData);
  }, [runInitialLoad, loadExploreData]);

  useEffect(() => {
    if (!preselectedTag) {
      return;
    }

    const normalized = preselectedTag.trim().toLowerCase();
    if (!normalized) {
      return;
    }

    setKeyword('');
    setSelectedTags([normalized]);
  }, [preselectedTag, preselectedTagVersion]);

  function toggleTag(tag: string): void {
    setSelectedTags((current) => {
      if (current.includes(tag)) {
        return current.filter((entry) => entry !== tag);
      }

      return [...current, tag];
    });
  }

  function clearTags(): void {
    setSelectedTags([]);
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Explore Leaves</Text>
      <Text style={styles.subtitle}>Search across known plants and save useful entries to your collection.</Text>

      <View style={styles.searchCard}>
        <Text style={styles.searchLabel}>Find a leaf</Text>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Common or scientific name"
            placeholderTextColor="#9ca3af"
            value={keyword}
            onChangeText={setKeyword}
            returnKeyType="search"
            onSubmitEditing={() => {
              void runInitialLoad(loadExploreData);
            }}
          />
          <Pressable
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={() => {
              void runInitialLoad(loadExploreData);
            }}
            disabled={loading}
          >
            <Text style={styles.searchButtonLabel}>{loading ? 'Searching...' : 'Search'}</Text>
          </Pressable>
        </View>

        {selectedTags.length > 0 && (
          <View style={styles.selectedTagWrap}>
            {selectedTags.map((tag) => (
              <Pressable key={tag} style={styles.tagPillActive} onPress={() => toggleTag(tag)}>
                <Text style={styles.tagPillActiveText}>#{tag}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.clearTagButton} onPress={clearTags}>
              <Text style={styles.clearTagButtonText}>Clear tags</Text>
            </Pressable>
          </View>
        )}
      </View>

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
              <Image source={getLeafImageSource(item.leafId, session?.token ?? '')} style={styles.leafImage} />
            ) : (
              <View style={styles.leafImagePlaceholder}>
                <Text style={styles.leafImagePlaceholderText}>No image available</Text>
              </View>
            )}

            <Text style={styles.leafTitle}>{item.commonName || 'Unknown'}</Text>
            <Text style={styles.leafMetaLabel}>Scientific Name</Text>
            <Text style={styles.leafMetaValue}>{item.scientificName || 'N/A'}</Text>

            <Text style={styles.leafMetaLabel}>Uses</Text>
            <Text style={styles.leafMetaValue}>{item.usage || 'N/A'}</Text>

            {Array.isArray(item.tags) && item.tags.length > 0 && (
              <View style={styles.itemTagsWrap}>
                {item.tags.map((tag) => (
                  <Pressable key={`${item.leafId}-${tag}`} style={styles.tagPill} onPress={() => toggleTag(String(tag).toLowerCase())}>
                    <Text style={styles.tagPillText}>#{tag}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Pressable
              style={[styles.saveButton, savingLeafId === item.leafId && styles.saveButtonDisabled]}
              onPress={() => onSaveLeaf(item.leafId)}
              disabled={savingLeafId === item.leafId}
            >
              <Text style={styles.saveButtonLabel}>
                {savingLeafId === item.leafId ? 'Saving...' : 'Save to Collection'}
              </Text>
            </Pressable>
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
    paddingTop: 12,
    gap: 10
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827'
  },
  subtitle: {
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4
  },
  searchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2
  },
  searchLabel: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '700',
    paddingLeft: 2
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    minHeight: 50,
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
    color: '#111827'
  },
  searchButton: {
    backgroundColor: '#8bc34a',
    borderRadius: 16,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14
  },
  searchButtonDisabled: {
    backgroundColor: '#b4c694'
  },
  searchButtonLabel: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700'
  },
  selectedTagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tagPillActive: {
    borderRadius: 999,
    backgroundColor: '#dfeedd',
    borderWidth: 1,
    borderColor: '#8bc34a',
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  tagPillActiveText: {
    color: '#14532d',
    fontSize: 12,
    fontWeight: '700'
  },
  clearTagButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fff1f2',
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  clearTagButtonText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700'
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
    gap: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2
  },
  leafImage: {
    width: '100%',
    height: 210,
    borderRadius: 14,
    backgroundColor: '#d1d5db',
    marginBottom: 8
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
  leafMetaLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4
  },
  leafMetaValue: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20
  },
  itemTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  tagPill: {
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  tagPillText: {
    color: '#1f2937',
    fontSize: 12,
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
  helperText: {
    color: '#4b5563',
    paddingHorizontal: 4
  },
  errorText: {
    color: '#dc2626',
    paddingHorizontal: 4
  }
});
