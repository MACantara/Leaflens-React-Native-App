import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

type StatusTone = 'info' | 'error' | 'success' | 'loading';

interface StatusBannerProps {
  tone: StatusTone;
  message: string;
  style?: ViewStyle;
}

interface EmptyStateCardProps {
  title: string;
  description: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
  style?: ViewStyle;
}

function getStatusColors(tone: StatusTone): {
  background: string;
  border: string;
  icon: string;
  text: string;
} {
  if (tone === 'error') {
    return {
      background: '#fef2f2',
      border: '#fecaca',
      icon: '#b91c1c',
      text: '#991b1b'
    };
  }

  if (tone === 'success') {
    return {
      background: '#ecfdf3',
      border: '#bbf7d0',
      icon: '#166534',
      text: '#166534'
    };
  }

  if (tone === 'loading') {
    return {
      background: '#eff6ff',
      border: '#bfdbfe',
      icon: '#1d4ed8',
      text: '#1e40af'
    };
  }

  return {
    background: '#f8fafc',
    border: '#cbd5e1',
    icon: '#334155',
    text: '#334155'
  };
}

function getStatusIcon(tone: StatusTone): React.ComponentProps<typeof Feather>['name'] {
  if (tone === 'error') {
    return 'alert-triangle';
  }

  if (tone === 'success') {
    return 'check-circle';
  }

  if (tone === 'loading') {
    return 'loader';
  }

  return 'info';
}

export function StatusBanner({ tone, message, style }: StatusBannerProps): React.JSX.Element {
  const colors = getStatusColors(tone);
  const iconName = getStatusIcon(tone);

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.background,
          borderColor: colors.border
        },
        style
      ]}
    >
      <View style={styles.bannerIconWrap}>
        {tone === 'loading' ? (
          <ActivityIndicator size="small" color={colors.icon} />
        ) : (
          <Feather name={iconName} size={16} color={colors.icon} />
        )}
      </View>
      <Text style={[styles.bannerText, { color: colors.text }]}>{message}</Text>
    </View>
  );
}

export function EmptyStateCard({ title, description, icon = 'inbox', style }: EmptyStateCardProps): React.JSX.Element {
  return (
    <View style={[styles.emptyCard, style]}>
      <View style={styles.emptyIconWrap}>
        <Feather name={icon} size={22} color="#475569" />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  bannerIconWrap: {
    width: 22,
    alignItems: 'center'
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600'
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 18,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  emptyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center'
  },
  emptyDescription: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center'
  }
});
