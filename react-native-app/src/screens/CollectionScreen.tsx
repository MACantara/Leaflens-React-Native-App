import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { getLeafImageSource, getUserHistory, searchUserLeaves } from '../api/leaves';
import { ApiError } from '../api/client';
import { LeafItem, Session } from '../types/models';
import { usePullToRefreshController } from '../utils/mobileGestures';

const ROOT_HORIZONTAL_PADDING = 20;
const CARD_HORIZONTAL_GAP = 16;
const CARD_MAX_WIDTH = 332;
const CARD_MIN_WIDTH = 260;

interface CollectionScreenProps {
  session: Session;
  onOpenLeafDetails?: (leafId: number) => void;
  globalSearchKeyword?: string;
  globalSearchTags?: string[];
  globalSearchVersion?: number;
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

export function CollectionScreen({
  session,
  onOpenLeafDetails,
  globalSearchKeyword,
  globalSearchTags,
  globalSearchVersion
}: CollectionScreenProps): React.JSX.Element {
  const [leafList, setLeafList] = useState<LeafItem[]>([]);
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedTags, setAppliedTags] = useState<string[]>([]);
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

  const fetchCollection = useCallback(
    async (nextKeyword: string, nextTags: string[]): Promise<void> => {
      setError('');

      try {
        const normalizedKeyword = nextKeyword.trim();
        const hasActiveFilters = nextTags.length > 0 || normalizedKeyword.length > 0;

        const historyOrSearch = hasActiveFilters
          ? await searchUserLeaves(session.userId, session.token, normalizedKeyword || undefined, nextTags)
          : await getUserHistory(session.userId, session.token).then((history) => history.leafList ?? []);

        setLeafList(historyOrSearch);
      } catch (refreshError) {
        setError(toErrorText(refreshError));
      }
    },
    [session.token, session.userId]
  );

  const refreshCollection = useCallback(async (): Promise<void> => {
    await fetchCollection(appliedKeyword, appliedTags);
  }, [appliedKeyword, appliedTags, fetchCollection]);

  useEffect(() => {
    void runInitialLoad(refreshCollection);
  }, [refreshCollection, runInitialLoad]);

  useEffect(() => {
    if (globalSearchVersion === undefined) {
      return;
    }

    const normalizedKeyword = (globalSearchKeyword ?? '').trim();
    const normalizedTags = globalSearchTags ?? [];
    setAppliedKeyword(normalizedKeyword);
    setAppliedTags(normalizedTags);

    void runInitialLoad(async () => {
      await fetchCollection(normalizedKeyword, normalizedTags);
    });
  }, [fetchCollection, globalSearchKeyword, globalSearchTags, globalSearchVersion, runInitialLoad]);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Your Collection</Text>

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
          <Pressable
            style={[styles.card, { width: cardWidth, minHeight: cardMinHeight }]}
            onPress={() => {
              onOpenLeafDetails?.(item.leafId);
            }}
          >
            {item.imageFilename || item.imageContentType || item.imageSize ? (
              <Image source={getLeafImageSource(item.leafId, session.token)} style={[styles.image, { height: cardImageHeight }]} />
            ) : (
              <View style={[styles.imagePlaceholder, { height: cardImageHeight }]}>
                <Text style={styles.imagePlaceholderText}>No image available</Text>
              </View>
            )}
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
  imagePlaceholder: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center'
  },
  imagePlaceholderText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600'
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
  disabledButton: {
    opacity: 0.6
  }
});
