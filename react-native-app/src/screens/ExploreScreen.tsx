import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  ImageBackground,
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
import { Feather } from '@expo/vector-icons';

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

  const fetchExplore = useCallback(
    async (nextKeyword: string, nextTags: string[]): Promise<void> => {
      if (!session) {
        setItems([]);
        return;
      }

      setError('');

      try {
        const results = await exploreLeaves(session.token, nextKeyword.trim() || undefined, nextTags);
        setItems(results);
      } catch (loadError) {
        setError(errorToText(loadError));
      }
    },
    [session]
  );

  const availableTags = useMemo(() => {
    const countByTag = new Map<string, number>();

    items.forEach((item) => {
      (item.tags ?? []).forEach((rawTag) => {
        const normalized = String(rawTag).trim().toLowerCase();
        if (!normalized) {
          return;
        }

        countByTag.set(normalized, (countByTag.get(normalized) ?? 0) + 1);
      });
    });

    return [...countByTag.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 10);
  }, [items]);

  const displayedTags = useMemo(() => {
    const merged = [...selectedTags, ...availableTags];
    const unique = new Set<string>();

    return merged.filter((tag) => {
      if (unique.has(tag)) {
        return false;
      }
      unique.add(tag);
      return true;
    });
  }, [availableTags, selectedTags]);

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

    setKeyword('');
    setSelectedTags([normalized]);
    void runInitialLoad(async () => {
      await fetchExplore('', [normalized]);
    });
  }, [fetchExplore, preselectedTag, preselectedTagVersion, runInitialLoad]);

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
      <View style={styles.searchFloatingCard}>
        <Pressable
          style={styles.iconCircleButton}
          onPress={() => {
            setKeyword('');
            clearTags();
            void runInitialLoad(async () => {
              await fetchExplore('', []);
            });
          }}
        >
          <Feather name="x" size={27} color="#111111" />
        </Pressable>

        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor="#9ca3af"
          value={keyword}
          onChangeText={setKeyword}
          returnKeyType="search"
          onSubmitEditing={() => {
            void runInitialLoad(loadExploreData);
          }}
        />

        <Pressable
          style={[styles.iconCircleButton, loading && styles.searchButtonDisabled]}
          onPress={() => {
            void runInitialLoad(loadExploreData);
          }}
          disabled={loading}
        >
          <Feather name="search" size={27} color="#111111" />
        </Pressable>
      </View>

      <View style={styles.filtersFloatingCard}>
        <View style={styles.filtersHeaderRow}>
          <View style={styles.filtersTitleWrap}>
            <Feather name="sliders" size={24} color="#475569" />
            <Text style={styles.filtersTitle}>Filters</Text>
          </View>

          <Pressable
            style={[styles.exploreButton, loading && styles.searchButtonDisabled]}
            onPress={() => {
              void runInitialLoad(loadExploreData);
            }}
            disabled={loading}
          >
            <Feather name="compass" size={21} color="#111111" />
            <Text style={styles.exploreButtonText}>{loading ? 'Loading' : 'Explore'}</Text>
          </Pressable>
        </View>

        <View style={styles.tagGrid}>
          {displayedTags.length > 0 ? (
            displayedTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <Pressable key={tag} style={[styles.tagPill, active && styles.tagPillActive]} onPress={() => toggleTag(tag)}>
                  <Text style={[styles.tagPillText, active && styles.tagPillActiveText]}>{tag}</Text>
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.noTagText}>Search to load suggested tags.</Text>
          )}
        </View>
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
  searchFloatingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 3
  },
  iconCircleButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#f4e9e4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    minHeight: 58,
    paddingHorizontal: 14,
    backgroundColor: '#f9fafb',
    fontSize: 18,
    color: '#111827'
  },
  searchButtonDisabled: {
    opacity: 0.65
  },
  filtersFloatingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3
  },
  filtersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  filtersTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937'
  },
  exploreButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#9ca3af',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  exploreButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700'
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  noTagText: {
    color: '#6b7280',
    fontSize: 13
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
  tagPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  tagPillActive: {
    backgroundColor: '#dfeedd',
    borderColor: '#8bc34a'
  },
  tagPillText: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600'
  },
  tagPillActiveText: {
    color: '#14532d',
    fontWeight: '700'
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
