import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { deleteLeaf, getUserHistory, getUserLeafCount, updateLeafImageVisibility } from '../api/leaves';
import { ApiError } from '../api/client';
import { useAppModal } from '../components/AppModalProvider';
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
  const { showConfirm } = useAppModal();
  const [history, setHistory] = useState<LeafItem[]>([]);
  const [leafCount, setLeafCount] = useState(0);
  const [deletingLeafId, setDeletingLeafId] = useState<number | undefined>();
  const [updatingVisibilityLeafId, setUpdatingVisibilityLeafId] = useState<number | undefined>();
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

  async function onDeleteLeaf(leafId: number): Promise<void> {
    setDeletingLeafId(leafId);
    setError('');

    try {
      await deleteLeaf(leafId, session.token);
      await loadHistory();
    } catch (deleteError) {
      setError(toErrorText(deleteError));
    } finally {
      setDeletingLeafId(undefined);
    }
  }

  async function confirmDeleteLeaf(item: LeafItem): Promise<void> {
    const leafName = item.commonName?.trim() || 'this plant';
    const confirmed = await showConfirm({
      title: 'Delete from history',
      message: `Remove ${leafName} from your history?`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      tone: 'danger'
    });

    if (!confirmed) {
      return;
    }

    await onDeleteLeaf(item.leafId);
  }

  async function onToggleImageVisibility(item: LeafItem): Promise<void> {
    setUpdatingVisibilityLeafId(item.leafId);
    setError('');

    const nextValue = !Boolean(item.isImagePublic);

    try {
      await updateLeafImageVisibility(item.leafId, nextValue, session.token);
      setHistory((current) =>
        current.map((leaf) =>
          leaf.leafId === item.leafId
            ? {
                ...leaf,
                isImagePublic: nextValue
              }
            : leaf
        )
      );
    } catch (visibilityError) {
      setError(toErrorText(visibilityError));
    } finally {
      setUpdatingVisibilityLeafId(undefined);
    }
  }

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

            <Text style={styles.shareStateText}>
              {item.isImagePublic ? 'Image visibility: Public' : 'Image visibility: Private'}
            </Text>

            <View style={styles.itemActionsRow}>
              <Pressable
                style={[styles.shareButton, updatingVisibilityLeafId === item.leafId && styles.disabledButton]}
                onPress={() => {
                  void onToggleImageVisibility(item);
                }}
                disabled={updatingVisibilityLeafId === item.leafId}
              >
                <Text style={styles.shareButtonLabel}>
                  {updatingVisibilityLeafId === item.leafId
                    ? 'Updating...'
                    : item.isImagePublic
                      ? 'Make Private'
                      : 'Share Publicly'}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.deleteButton, deletingLeafId === item.leafId && styles.disabledButton]}
                onPress={() => {
                  void confirmDeleteLeaf(item);
                }}
                disabled={deletingLeafId === item.leafId}
              >
                <Text style={styles.deleteButtonLabel}>{deletingLeafId === item.leafId ? 'Deleting...' : 'Delete'}</Text>
              </Pressable>
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
  shareStateText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600'
  },
  itemActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  shareButton: {
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  shareButtonLabel: {
    color: '#0c4a6e',
    fontWeight: '700',
    fontSize: 12
  },
  deleteButton: {
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  deleteButtonLabel: {
    color: '#991b1b',
    fontWeight: '700',
    fontSize: 12
  },
  disabledButton: {
    opacity: 0.6
  }
});
