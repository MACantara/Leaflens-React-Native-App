import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface TabItem {
  key: string;
  label: string;
}

interface SegmentedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
}

export function SegmentedTabs({ tabs, activeTab, onChange }: SegmentedTabsProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, active ? styles.activeTab : styles.inactiveTab]}
          >
            <Text style={[styles.label, active ? styles.activeLabel : styles.inactiveLabel]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 14,
    backgroundColor: '#f0f4f8',
    padding: 4,
    gap: 6
  },
  tab: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  activeTab: {
    backgroundColor: '#1e3a8a'
  },
  inactiveTab: {
    backgroundColor: '#e2e8f0'
  },
  label: {
    fontSize: 12,
    fontWeight: '700'
  },
  activeLabel: {
    color: '#ffffff'
  },
  inactiveLabel: {
    color: '#1f2937'
  }
});
