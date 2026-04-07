import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { getUserHistory, getUserLeafCount } from '../api/leaves';
import { ApiError } from '../api/client';
import { LeafItem, Session } from '../types/models';
import { usePullToRefreshController } from '../utils/mobileGestures';

interface HistoryScreenProps {
  session: Session;
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

export function HistoryScreen({ session }: HistoryScreenProps): React.JSX.Element {
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
      <Text style={styles.helperText}>Total saved leaves: {leafCount}</Text>
      {loading && <Text style={styles.helperText}>Loading history...</Text>}
      {error.length > 0 && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={history}
        keyExtractor={(item) => String(item.leafId)}
        contentContainerStyle={styles.listContent}
        onRefresh={() => {
          void runPullToRefresh(loadHistory);
        }}
        refreshing={refreshing}
        renderItem={({ item }) => (
          <View style={styles.itemPill}>
            <View style={styles.itemTopRow}>
              <Text style={styles.itemText}>{item.commonName || 'Cannot identify plant from image'}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.helperText}>No history yet.</Text> : null}
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
  },
  disabledButton: {
    opacity: 0.6
  }
});
