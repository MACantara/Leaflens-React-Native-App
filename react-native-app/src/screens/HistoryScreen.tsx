import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { getUserHistory, getUserLeafCount } from '../api/leaves';
import { ApiError } from '../api/client';
import { EmptyStateCard, StatusBanner } from '../components/StateFeedback';
import { LeafItem, Session } from '../types/models';
import { usePullToRefreshController } from '../utils/mobileGestures';

interface HistoryScreenProps {
  session: Session;
  onOpenLeafDetails?: (leafId: number) => void;
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

export function HistoryScreen({ session, onOpenLeafDetails }: HistoryScreenProps): React.JSX.Element {
  const [history, setHistory] = useState<LeafItem[]>([]);
  const [leafCount, setLeafCount] = useState(0);
  const [error, setError] = useState('');
  const { loading, refreshing, runInitialLoad, runPullToRefresh } = usePullToRefreshController();

  const loadHistory = useCallback(async (): Promise<void> => {
    setError('');

    try {
      const [response, count] = await Promise.all([
        getUserHistory(session.userId, session.token),
        getUserLeafCount(session.userId, session.token)
      ]);
      setHistory(response.leafList ?? []);
      setLeafCount(count);
    } catch (historyError) {
      setError(toErrorText(historyError));
    }
  }, [session.token, session.userId]);

  useEffect(() => {
    void runInitialLoad(loadHistory);
  }, [runInitialLoad, loadHistory]);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Lens History</Text>
      <StatusBanner tone="info" message={`Total saved leaves: ${leafCount}`} />
      {loading && <StatusBanner tone="loading" message="Loading your activity history..." />}
      {error.length > 0 && <StatusBanner tone="error" message={error} />}

      <FlatList
        data={history}
        keyExtractor={(item) => String(item.leafId)}
        contentContainerStyle={[styles.listContent, !loading && history.length === 0 ? styles.listContentEmpty : undefined]}
        onRefresh={() => {
          void runPullToRefresh(loadHistory);
        }}
        refreshing={refreshing}
        renderItem={({ item }) => (
          <Pressable
            style={styles.itemPill}
            onPress={() => {
              onOpenLeafDetails?.(item.leafId);
            }}
          >
            <View style={styles.itemTopRow}>
              <Text style={styles.itemText}>{item.commonName || 'Cannot identify plant from image'}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading ? (
            <EmptyStateCard
              icon="clock"
              title="No History Yet"
              description="Your analyzed or saved plants will appear here for quick revisit."
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ece1dd',
    paddingHorizontal: 20,
    paddingTop: 12
  },
  title: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14
  },
  helperText: {
    color: '#4b5563',
    fontSize: 18,
    marginBottom: 10
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 10
  },
  listContent: {
    gap: 12,
    paddingBottom: 18
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center'
  },
  itemPill: {
    backgroundColor: '#e6f1e6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  itemText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
    flex: 1
  }
});
