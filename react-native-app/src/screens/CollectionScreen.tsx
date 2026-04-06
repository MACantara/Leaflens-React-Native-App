import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getLeafImageUrl, getUserHistory } from '../api/leaves';
import { ApiError } from '../api/client';
import { LeafItem, Session } from '../types/models';

interface CollectionScreenProps {
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

export function CollectionScreen({ session }: CollectionScreenProps): React.JSX.Element {
  const [leafList, setLeafList] = useState<LeafItem[]>([]);
  const [selectedLeaf, setSelectedLeaf] = useState<LeafItem | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function refreshCollection(): Promise<void> {
    setLoading(true);
    setError('');

    try {
      const history = await getUserHistory(session.userId, session.token);
      setLeafList(history.leafList ?? []);
    } catch (refreshError) {
      setError(toErrorText(refreshError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshCollection();
  }, []);

  if (selectedLeaf) {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.detailWrap}>
        <Pressable style={styles.backRow} onPress={() => setSelectedLeaf(undefined)}>
          <Feather name="arrow-left" size={30} color="#111827" />
        </Pressable>

        <View style={styles.detailCard}>
          <Image source={{ uri: getLeafImageUrl(selectedLeaf.leafId) }} style={styles.detailImage} />
          <Text style={styles.detailTitle}>{selectedLeaf.commonName || 'N/A'}</Text>
          <Text style={styles.detailScientific}>{selectedLeaf.scientificName || 'N/A'}</Text>

          <Text style={styles.detailSectionTitle}>Origin</Text>
          <Text style={styles.detailSectionBody}>{selectedLeaf.origin || 'N/A'}</Text>

          <Text style={styles.detailSectionTitle}>Uses</Text>
          <Text style={styles.detailSectionBody}>{selectedLeaf.usage || 'N/A'}</Text>

          <Text style={styles.detailSectionTitle}>Habitat</Text>
          <Text style={styles.detailSectionBody}>{selectedLeaf.habitat || 'N/A'}</Text>
        </View>
      </ScrollView>
    );
  }

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
        snapToInterval={348}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => String(item.leafId)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => setSelectedLeaf(item)}>
            <Image source={{ uri: getLeafImageUrl(item.leafId) }} style={styles.image} />
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
    marginBottom: 14,
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
    paddingRight: 22,
    gap: 16,
    paddingBottom: 10
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 14,
    width: 332,
    minHeight: 504,
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3
  },
  image: {
    width: '100%',
    height: 340,
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
  }
});
