import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface AboutScreenProps {
  onNewPlant: () => void;
}

export function AboutScreen({ onNewPlant }: AboutScreenProps): React.JSX.Element {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>About Us</Text>

      <View style={styles.card}>
        <Text style={styles.heading}>LeafLens</Text>
        <Text style={styles.body}>
          LeafLens is your ultimate plant identification companion. Using advanced image recognition technology, we help
          you discover and learn about the plants around you.
        </Text>

        <Text style={styles.section}>Our Mission</Text>
        <Text style={styles.body}>
          To make plant identification accessible to everyone and promote environmental awareness through technology.
        </Text>

        <Text style={styles.section}>Features</Text>
        <Text style={styles.bullet}>• Instant plant identification</Text>
        <Text style={styles.bullet}>• Comprehensive plant database</Text>
        <Text style={styles.bullet}>• Detailed plant information</Text>
        <Text style={styles.bullet}>• History tracking</Text>
        <Text style={styles.bullet}>• User-friendly interface</Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={onNewPlant}>
        <Text style={styles.primaryButtonLabel}>NEW PLANT</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ece1dd'
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 16
  },
  title: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3
  },
  heading: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800'
  },
  section: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8
  },
  body: {
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 27
  },
  bullet: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 24
  },
  primaryButton: {
    backgroundColor: '#8bc34a',
    borderRadius: 18,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButtonLabel: {
    color: '#f3fff0',
    fontSize: 18,
    fontWeight: '700'
  }
});
