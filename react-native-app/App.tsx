import React, { useMemo, useState } from 'react';
import { Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthScreen } from './src/screens/AuthScreen.tsx';
import { AnalyzeScreen } from './src/screens/AnalyzeScreen.tsx';
import { CollectionScreen } from './src/screens/CollectionScreen.tsx';
import { HistoryScreen } from './src/screens/HistoryScreen.tsx';
import { AboutScreen } from './src/screens/AboutScreen.tsx';
import { Session } from './src/types/models';

type AppTab = 'home' | 'lens' | 'history' | 'about';

interface MenuItem {
  key: AppTab | 'logout';
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
}

const menuItems: MenuItem[] = [
  { key: 'home', label: 'Your Collection', icon: 'home' },
  { key: 'lens', label: 'New Plant', icon: 'camera' },
  { key: 'history', label: 'Lens History', icon: 'list' },
  { key: 'about', label: 'About Us', icon: 'info' },
  { key: 'logout', label: 'Log out', icon: 'log-out' }
];

function renderActiveTab(tab: AppTab, session: Session, onNewPlant: () => void): React.JSX.Element {
  if (tab === 'home') {
    return <CollectionScreen session={session} />;
  }

  if (tab === 'lens') {
    return <AnalyzeScreen session={session} />;
  }

  if (tab === 'history') {
    return <HistoryScreen session={session} />;
  }

  return <AboutScreen onNewPlant={onNewPlant} />;
}

export default function App(): React.JSX.Element {
  const [session, setSession] = useState<Session | undefined>();
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [menuVisible, setMenuVisible] = useState(false);

  const welcomeText = useMemo(() => (session ? session.userName : 'Guest'), [session]);

  function handleLogout(): void {
    setSession(undefined);
    setActiveTab('home');
    setMenuVisible(false);
  }

  function handleMenuSelect(itemKey: MenuItem['key']): void {
    if (itemKey === 'logout') {
      handleLogout();
      return;
    }

    setActiveTab(itemKey);
    setMenuVisible(false);
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar style="dark" />
        <AuthScreen onAuthenticated={setSession} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.drawer} onPress={() => undefined}>
            <Text style={styles.drawerTitle}>Menu</Text>
            {menuItems.map((item) => (
              <Pressable key={item.key} style={styles.drawerItem} onPress={() => handleMenuSelect(item.key)}>
                <Feather name={item.icon} size={18} color={item.key === 'logout' ? '#b91c1c' : '#111827'} />
                <Text style={[styles.drawerItemLabel, item.key === 'logout' && styles.drawerLogout]}>{item.label}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.header}>
        <Pressable style={styles.circleIconButton} onPress={() => setMenuVisible(true)}>
          <Feather name="menu" size={24} color="#1f2937" />
        </Pressable>

        <View style={styles.brandWrap}>
          <Text style={styles.brandLine1}>LEAFLENS</Text>
          <Text style={styles.brandLine2}>{welcomeText}</Text>
        </View>

        <Pressable style={styles.circleIconButton} onPress={() => setActiveTab('home')}>
          <Feather name="search" size={22} color="#1f2937" />
        </Pressable>
      </View>

      <View style={styles.content}>{renderActiveTab(activeTab, session, () => setActiveTab('lens'))}</View>

      <View style={styles.bottomNavWrap}>
        <View style={styles.bottomNav}>
          <Pressable style={[styles.navButton, activeTab === 'home' && styles.navButtonActive]} onPress={() => setActiveTab('home')}>
            <Ionicons name="home-outline" size={26} color={activeTab === 'home' ? '#111827' : '#6b7280'} />
          </Pressable>
          <Pressable style={[styles.navButton, activeTab === 'lens' && styles.navButtonActive]} onPress={() => setActiveTab('lens')}>
            <MaterialCommunityIcons name="leaf" size={26} color={activeTab === 'lens' ? '#111827' : '#6b7280'} />
          </Pressable>
          <Pressable style={[styles.navButton, activeTab === 'history' && styles.navButtonActive]} onPress={() => setActiveTab('history')}>
            <Feather name="list" size={26} color={activeTab === 'history' ? '#111827' : '#6b7280'} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ece1dd'
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  brandWrap: {
    flex: 1,
    marginHorizontal: 14
  },
  brandLine1: {
    color: '#0f0f0f',
    fontSize: 22,
    fontWeight: '800'
  },
  brandLine2: {
    color: '#64748b',
    marginTop: -2,
    fontSize: 12,
    fontWeight: '600'
  },
  circleIconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    flex: 1
  },
  bottomNavWrap: {
    paddingHorizontal: 20,
    paddingVertical: 14
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f6f6f6',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10
  },
  navButton: {
    width: 62,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  navButtonActive: {
    backgroundColor: '#dfeedd'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)'
  },
  drawer: {
    width: 248,
    height: '100%',
    backgroundColor: '#ffffff',
    paddingTop: 52,
    paddingHorizontal: 16,
    gap: 6
  },
  drawerTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '700'
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10
  },
  drawerItemLabel: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600'
  },
  drawerLogout: {
    color: '#b91c1c'
  }
});
