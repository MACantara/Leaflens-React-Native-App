import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { deleteLeaf, getLeafImageSource, getUserHistory, updateLeafImageVisibility } from '../api/leaves';
import { ApiError } from '../api/client';
import { useAppModal } from '../components/AppModalProvider';
import { LeafItem, Session } from '../types/models';

interface PlantDetailsScreenProps {
  session: Session;
  leafId: number;
  leafVersion?: number;
  onBack: () => void;
  onExploreTag?: (tag: string) => void;
  onDeleted?: () => void;
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

export function PlantDetailsScreen({
  session,
  leafId,
  leafVersion,
  onBack,
  onExploreTag,
  onDeleted
}: PlantDetailsScreenProps): React.JSX.Element {
  const { showConfirm } = useAppModal();
  const [leaf, setLeaf] = useState<LeafItem | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingLeafId, setDeletingLeafId] = useState<number | undefined>();
  const [updatingVisibilityLeafId, setUpdatingVisibilityLeafId] = useState<number | undefined>();

  const selectedLeafTags = useMemo(() => leaf?.tags ?? [], [leaf]);
  const selectedLeafCharacteristics = useMemo(() => leaf?.keyCharacteristics ?? [], [leaf]);
  const selectedLeafCavite = Boolean(leaf?.isGrownInCavite);

  const loadLeaf = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      const history = await getUserHistory(session.userId, session.token);
      const matchedLeaf = (history.leafList ?? []).find((entry) => entry.leafId === leafId);

      if (!matchedLeaf) {
        setLeaf(undefined);
        setError('Plant details are not available.');
        return;
      }

      setLeaf(matchedLeaf);
    } catch (loadError) {
      setError(toErrorText(loadError));
    } finally {
      setLoading(false);
    }
  }, [leafId, session.token, session.userId]);

  useEffect(() => {
    void loadLeaf();
  }, [loadLeaf, leafVersion]);

  async function onDeleteLeaf(): Promise<void> {
    if (!leaf) {
      return;
    }

    setDeletingLeafId(leaf.leafId);
    setError('');

    try {
      await deleteLeaf(leaf.leafId, session.token);
      onDeleted?.();
      onBack();
    } catch (deleteError) {
      setError(toErrorText(deleteError));
    } finally {
      setDeletingLeafId(undefined);
    }
  }

  async function confirmDeleteLeaf(): Promise<void> {
    if (!leaf) {
      return;
    }

    const leafName = leaf.commonName?.trim() || 'this plant';
    const confirmed = await showConfirm({
      title: 'Delete from collection',
      message: `Remove ${leafName} from your collection?`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      tone: 'danger'
    });

    if (!confirmed) {
      return;
    }

    await onDeleteLeaf();
  }

  async function onToggleImageVisibility(): Promise<void> {
    if (!leaf) {
      return;
    }

    setUpdatingVisibilityLeafId(leaf.leafId);
    setError('');

    const nextValue = !Boolean(leaf.isImagePublic);

    try {
      await updateLeafImageVisibility(leaf.leafId, nextValue, session.token);
      setLeaf((current) => (current ? { ...current, isImagePublic: nextValue } : current));
    } catch (visibilityError) {
      setError(toErrorText(visibilityError));
    } finally {
      setUpdatingVisibilityLeafId(undefined);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.detailWrap}>
      <Pressable style={styles.backRow} onPress={onBack}>
        <Feather name="arrow-left" size={30} color="#111827" />
      </Pressable>

      {loading && <Text style={styles.helperText}>Loading details...</Text>}
      {error.length > 0 && <Text style={styles.errorText}>{error}</Text>}

      {leaf ? (
        <View style={styles.detailCard}>
          {leaf.imageFilename || leaf.imageContentType || leaf.imageSize ? (
            <Image source={getLeafImageSource(leaf.leafId, session.token)} style={styles.detailImage} />
          ) : (
            <View style={styles.detailImagePlaceholder}>
              <Text style={styles.detailImagePlaceholderText}>No image available</Text>
            </View>
          )}
          <Text style={styles.detailTitle}>{leaf.commonName || 'N/A'}</Text>
          <Text style={styles.detailScientific}>{leaf.scientificName || 'N/A'}</Text>
          {selectedLeafCavite && <Text style={styles.caviteBadge}>Grows in Cavite</Text>}

          <Text style={styles.detailSectionTitle}>Origin</Text>
          <Text style={styles.detailSectionBody}>{leaf.origin || 'N/A'}</Text>

          <Text style={styles.detailSectionTitle}>Uses</Text>
          <Text style={styles.detailSectionBody}>{leaf.usage || 'N/A'}</Text>

          <Text style={styles.detailSectionTitle}>Habitat</Text>
          <Text style={styles.detailSectionBody}>{leaf.habitat || 'N/A'}</Text>

          {(leaf.confidenceLabel || leaf.confidenceScore !== undefined) && (
            <>
              <Text style={styles.detailSectionTitle}>AI Confidence</Text>
              <Text style={styles.detailSectionBody}>
                {leaf.confidenceLabel || 'Unknown'}
                {typeof leaf.confidenceScore === 'number' ? ` (${leaf.confidenceScore}%)` : ''}
              </Text>
            </>
          )}

          {selectedLeafCharacteristics.length > 0 && (
            <>
              <Text style={styles.detailSectionTitle}>Key Characteristics</Text>
              <View style={styles.tagWrap}>
                {selectedLeafCharacteristics.map((feature) => (
                  <View key={feature} style={styles.tagPill}>
                    <Text style={styles.tagText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {leaf.careTips && leaf.careTips.trim().length > 0 && (
            <>
              <Text style={styles.detailSectionTitle}>Care Tips</Text>
              <Text style={styles.detailSectionBody}>{leaf.careTips}</Text>
            </>
          )}

          {leaf.safetyNotes && leaf.safetyNotes.trim().length > 0 && (
            <>
              <Text style={styles.detailSectionTitle}>Safety Notes</Text>
              <Text style={styles.warningText}>{leaf.safetyNotes}</Text>
            </>
          )}

          {leaf.identificationNotes && leaf.identificationNotes.trim().length > 0 && (
            <>
              <Text style={styles.detailSectionTitle}>Identification Notes</Text>
              <Text style={styles.detailSectionBody}>{leaf.identificationNotes}</Text>
            </>
          )}

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

          {leaf.ownerUserId === session.userId && (
            <>
              <Text style={styles.detailSectionTitle}>Image visibility</Text>
              <Text style={styles.detailSectionBody}>{leaf.isImagePublic ? 'Public' : 'Private'}</Text>

              <Pressable
                style={[styles.visibilityButton, updatingVisibilityLeafId === leaf.leafId && styles.disabledButton]}
                onPress={() => {
                  void onToggleImageVisibility();
                }}
                disabled={updatingVisibilityLeafId === leaf.leafId}
              >
                <Text style={styles.visibilityButtonLabel}>
                  {updatingVisibilityLeafId === leaf.leafId
                    ? 'Updating...'
                    : leaf.isImagePublic
                      ? 'Make Private'
                      : 'Share Publicly'}
                </Text>
              </Pressable>
            </>
          )}

          <Pressable
            style={[styles.deleteButton, deletingLeafId === leaf.leafId && styles.disabledButton]}
            onPress={() => {
              void confirmDeleteLeaf();
            }}
            disabled={deletingLeafId === leaf.leafId}
          >
            <Text style={styles.deleteButtonLabel}>{deletingLeafId === leaf.leafId ? 'Deleting...' : 'Delete Leaf'}</Text>
          </Pressable>
        </View>
      ) : (
        !loading && (
          <View style={styles.detailCard}>
            <Text style={styles.helperText}>Unable to load this plant detail.</Text>
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ece1dd',
    paddingHorizontal: 20
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
  helperText: {
    color: '#475569',
    paddingHorizontal: 4
  },
  errorText: {
    color: '#dc2626',
    paddingHorizontal: 4
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
  detailImagePlaceholder: {
    width: '100%',
    height: 390,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center'
  },
  detailImagePlaceholderText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600'
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
  warningText: {
    color: '#7c2d12',
    backgroundColor: '#ffedd5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    lineHeight: 20
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
  visibilityButton: {
    marginTop: 2,
    borderRadius: 14,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    paddingVertical: 12
  },
  visibilityButtonLabel: {
    color: '#0c4a6e',
    fontSize: 14,
    fontWeight: '700'
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
