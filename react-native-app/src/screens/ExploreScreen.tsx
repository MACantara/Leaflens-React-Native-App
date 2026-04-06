import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { exploreLeaves, saveExploreLeaf } from '../api/leaves';
import { ApiError } from '../api/client';
import { LeafItem, Session } from '../types/models';

interface ExploreScreenProps {
  session?: Session;
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

export function ExploreScreen({ session }: ExploreScreenProps): React.JSX.Element {
  const [keyword, setKeyword] = useState('');
  const [items, setItems] = useState<LeafItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savingLeafId, setSavingLeafId] = useState<number | undefined>();

  async function loadExploreData(): Promise<void> {
    setLoading(true);
    setError('');

    try {
      const results = await exploreLeaves(keyword.trim() || undefined);
      setItems(results);
    } catch (loadError) {
      setError(errorToText(loadError));
    } finally {
      setLoading(false);
    }
  }

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
    void loadExploreData();
  }, []);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Explore Leaves</Text>
      <Text style={styles.subtitle}>Search across stored leaves and save useful entries.</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search common or scientific name"
          value={keyword}
          onChangeText={setKeyword}
        />
        <Pressable style={styles.searchButton} onPress={loadExploreData}>
          <Text style={styles.searchButtonLabel}>Search</Text>
        </Pressable>
      </View>

      {loading && <Text style={styles.helperText}>Loading...</Text>}
      {error.length > 0 && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.leafId)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.leafTitle}>{item.commonName || 'Unknown'}</Text>
            <Text style={styles.leafMeta}>Scientific: {item.scientificName || 'N/A'}</Text>
            <Text style={styles.leafMeta}>Uses: {item.usage || 'N/A'}</Text>

            <Pressable
              style={styles.saveButton}
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
    backgroundColor: '#f8fafc',
    padding: 16,
    gap: 10
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a'
  },
  subtitle: {
    color: '#475569'
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff'
  },
  searchButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center'
  },
  searchButtonLabel: {
    color: '#ffffff',
    fontWeight: '700'
  },
  listContent: {
    gap: 10,
    paddingBottom: 24
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    gap: 6
  },
  leafTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a'
  },
  leafMeta: {
    color: '#374151'
  },
  saveButton: {
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: '#0f766e',
    alignItems: 'center',
    paddingVertical: 10
  },
  saveButtonLabel: {
    color: '#ffffff',
    fontWeight: '700'
  },
  helperText: {
    color: '#475569'
  },
  errorText: {
    color: '#dc2626'
  }
});
