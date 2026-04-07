import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { deleteLeaf, getLeafImageSource, getUserHistory, getUserTags, searchUserLeaves } from '../api/leaves';
import { ApiError } from '../api/client';
import { LeafItem, Session } from '../types/models';
import { usePullToRefreshController } from '../utils/mobileGestures';

const ROOT_HORIZONTAL_PADDING = 20;
const CARD_HORIZONTAL_GAP = 16;
const CARD_MAX_WIDTH = 332;
const CARD_MIN_WIDTH = 260;

interface CollectionScreenProps {
  session: Session;
  onExploreTag?: (tag: string) => void;
}

function toErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unexpected error.';
}

export function CollectionScreen({ session, onExploreTag }: CollectionScreenProps): React.JSX.Element {
  const [leafList, setLeafList] = useState<LeafItem[]>([]);
  const [selectedLeaf, setSelectedLeaf] = useState<LeafItem | undefined>();
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [deletingLeafId, setDeletingLeafId] = useState<number | undefined>();
  const [error, setError] = useState('');
  const { width: viewportWidth } = useWindowDimensions();
  const { loading, refreshing, runInitialLoad, runPullToRefresh } = usePullToRefreshController();

  const cardWidth = Math.max(
    CARD_MIN_WIDTH,
    Math.min(CARD_MAX_WIDTH, viewportWidth - ROOT_HORIZONTAL_PADDING * 2 - 2)
  );
  const cardImageHeight = Math.max(220, Math.min(340, Math.round(cardWidth * 1.02)));
  const cardMinHeight = cardImageHeight + 140;
  const snapInterval = cardWidth + CARD_HORIZONTAL_GAP;

  const hasFilters = keyword.trim().length > 0 || selectedTags.length > 0;

  const refreshCollection = useCallback(async (): Promise<void> => {
    setError('');

    try {
      const [historyOrSearch, tags] = await Promise.all([
        hasFilters
          ? searchUserLeaves(session.userId, session.token, keyword.trim() || undefined, selectedTags)
          : getUserHistory(session.userId, session.token).then((history) => history.leafList ?? []),
        getUserTags(session.userId, session.token)
      ]);

      setLeafList(historyOrSearch);
      setAvailableTags(tags);
    } catch (refreshError) {
      setError(toErrorText(refreshError));
    }
  }, [hasFilters, keyword, selectedTags, session.token, session.userId]);

  const selectedLeafTags = useMemo(() => selectedLeaf?.tags ?? [], [selectedLeaf]);
  const selectedLeafCavite = Boolean(selectedLeaf?.isGrownInCavite);

  useEffect(() => {
    void runInitialLoad(refreshCollection);
  }, [runInitialLoad, refreshCollection]);

  function toggleTag(tag: string): void {
    setSelectedTags((current) => {
      if (current.includes(tag)) {
        return current.filter((entry) => entry !== tag);
      }

      return [...current, tag];
    });
  }

  async function onDeleteLeaf(leafId: number): Promise<void> {
    setDeletingLeafId(leafId);
    setError('');

    try {
      await deleteLeaf(leafId, session.token);
      setSelectedLeaf(undefined);
      await refreshCollection();
    } catch (deleteError) {
      setError(toErrorText(deleteError));
    } finally {
      setDeletingLeafId(undefined);
    }
  }

  if (selectedLeaf) {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.detailWrap}>
        <Pressable style={styles.backRow} onPress={() => setSelectedLeaf(undefined)}>
          <Feather name="arrow-left" size={30} color="#111827" />
        </Pressable>

        <View style={styles.detailCard}>
          <Image source={getLeafImageSource(selectedLeaf.leafId, session.token)} style={styles.detailImage} />
          <Text style={styles.detailTitle}>{selectedLeaf.commonName || 'N/A'}</Text>
          <Text style={styles.detailScientific}>{selectedLeaf.scientificName || 'N/A'}</Text>
          <Text style={styles.caviteBadge}>{selectedLeafCavite ? 'Known in Cavite' : 'Cavite status unknown'}</Text>

          <Text style={styles.detailSectionTitle}>Origin</Text>
          <Text style={styles.detailSectionBody}>{selectedLeaf.origin || 'N/A'}</Text>

          <Text style={styles.detailSectionTitle}>Uses</Text>
          <Text style={styles.detailSectionBody}>{selectedLeaf.usage || 'N/A'}</Text>

          <Text style={styles.detailSectionTitle}>Habitat</Text>
          <Text style={styles.detailSectionBody}>{selectedLeaf.habitat || 'N/A'}</Text>

          <Text style={styles.detailSectionTitle}>Tags</Text>
          {selectedLeafTags.length > 0 ? (
            <View style={styles.tagWrap}>
              {selectedLeafTags.map((tag) => (
                <Pressable key={tag} style={styles.tagPill} onPress={() => onExploreTag?.(tag)}>
                  <Text style={styles.tagText}>{tag}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.detailSectionBody}>N/A</Text>
          )}

          <Pressable
            style={[styles.deleteButton, deletingLeafId === selectedLeaf.leafId && styles.disabledButton]}
            onPress={() => {
              void onDeleteLeaf(selectedLeaf.leafId);
            }}
            disabled={deletingLeafId === selectedLeaf.leafId}
          >
            <Text style={styles.deleteButtonLabel}>{deletingLeafId === selectedLeaf.leafId ? 'Deleting...' : 'Delete Leaf'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Your Collection</Text>

      <View style={styles.searchCard}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search your collection"
            placeholderTextColor="#9ca3af"
            value={keyword}
            onChangeText={setKeyword}
            returnKeyType="search"
            onSubmitEditing={() => {
              void runInitialLoad(refreshCollection);
            }}
          />
          <Pressable
            style={[styles.searchButton, loading && styles.disabledButton]}
            onPress={() => {
              void runInitialLoad(refreshCollection);
            }}
            disabled={loading}
          >
            <Text style={styles.searchButtonLabel}>Search</Text>
          </Pressable>
        </View>

        {availableTags.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagFilterRow}>
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <Pressable key={tag} style={[styles.tagFilterPill, isSelected && styles.tagFilterPillActive]} onPress={() => toggleTag(tag)}>
                  <Text style={[styles.tagFilterText, isSelected && styles.tagFilterTextActive]}>{tag}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {loading && <Text style={styles.helperText}>Loading...</Text>}
      {error.length > 0 && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={leafList}
        horizontal
        snapToAlignment="start"
        decelerationRate="fast"
        snapToInterval={snapInterval}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => String(item.leafId)}
        contentContainerStyle={[styles.listContent, { paddingRight: ROOT_HORIZONTAL_PADDING + 2 }]}
        onRefresh={() => {
          void runPullToRefresh(refreshCollection);
        }}
        refreshing={refreshing}
        renderItem={({ item }) => (
          <Pressable style={[styles.card, { width: cardWidth, minHeight: cardMinHeight }]} onPress={() => setSelectedLeaf(item)}>
            <Image source={getLeafImageSource(item.leafId, session.token)} style={[styles.image, { height: cardImageHeight }]} />
            <Text style={styles.cardTitle}>{item.commonName || 'N/A'}</Text>
            <Text style={styles.cardMeta}>{item.scientificName || 'N/A'}</Text>
          </Pressable>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.helperText}>No saved leaves found.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ece1dd',
    paddingHorizontal: 20
  },
  title: {
    marginTop: 12,
    marginBottom: 10,
    fontSize: 20,
    fontWeight: '800',
    color: '#111827'
  },
  searchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    gap: 10
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 14,
    minHeight: 46,
    paddingHorizontal: 12,
    color: '#111827'
  },
  searchButton: {
    minWidth: 84,
    borderRadius: 14,
    backgroundColor: '#8bc34a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10
  },
  searchButtonLabel: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700'
  },
  tagFilterRow: {
    gap: 8,
    paddingRight: 6
  },
  tagFilterPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f8fafc'
  },
  tagFilterPillActive: {
    backgroundColor: '#dfeedd',
    borderColor: '#8bc34a'
  },
  tagFilterText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600'
  },
  tagFilterTextActive: {
    color: '#14532d'
  },
  helperText: {
    color: '#475569',
    paddingHorizontal: 4
  },
  errorText: {
    color: '#dc2626',
    paddingHorizontal: 4
  },
  listContent: {
    gap: 16,
    paddingBottom: 10
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 14,
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3
  },
  image: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#e2e8f0'
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#111827'
  },
  cardMeta: {
    color: '#4b5563',
    fontSize: 17
  },
  detailWrap: {
    paddingTop: 4,
    paddingBottom: 22,
    gap: 12
  },
  backRow: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center'
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    gap: 8
  },
  detailImage: {
    width: '100%',
    height: 390,
    borderRadius: 20,
    backgroundColor: '#d1d5db'
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f0f0f'
  },
  detailScientific: {
    fontSize: 14,
    color: '#4b5563'
  },
  caviteBadge: {
    marginTop: 2,
    color: '#14532d',
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700'
  },
  detailSectionTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827'
  },
  detailSectionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151'
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tagPill: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  tagText: {
    color: '#1f2937',
    fontSize: 12,
    fontWeight: '600'
  },
  deleteButton: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    paddingVertical: 12
  },
  deleteButtonLabel: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '700'
  },
  disabledButton: {
    opacity: 0.6
  }
});
