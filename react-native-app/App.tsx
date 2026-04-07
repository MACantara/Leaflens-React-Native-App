import React, { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, SafeAreaView, StatusBar as NativeStatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { exploreLeaves, getUserTags } from './src/api/leaves';
import { AuthScreen } from './src/screens/AuthScreen';
import { AnalyzeScreen } from './src/screens/AnalyzeScreen';
import { CollectionScreen } from './src/screens/CollectionScreen';
import { PlantDetailsScreen } from './src/screens/PlantDetailsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { AboutScreen } from './src/screens/AboutScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AppModalProvider } from './src/components/AppModalProvider';
import { Session } from './src/types/models';
import { createEdgeMenuPanResponder } from './src/utils/mobileGestures';

type AppTab = 'home' | 'lens' | 'history' | 'explore' | 'profile' | 'about';
type GlobalSearchScope = 'collection' | 'explore';

interface MenuItem {
  key: AppTab | 'logout';
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
}

const menuItems: MenuItem[] = [
  { key: 'home', label: 'Your Collection', icon: 'home' },
  { key: 'lens', label: 'New Plant', icon: 'camera' },
  { key: 'history', label: 'Lens History', icon: 'list' },
  { key: 'explore', label: 'Explore Leaves', icon: 'search' },
  { key: 'profile', label: 'Profile', icon: 'user' },
  { key: 'about', label: 'About Us', icon: 'info' },
  { key: 'logout', label: 'Log out', icon: 'log-out' }
];

const GESTURE_COOLDOWN_MS = 700;

function renderActiveTab(
  tab: AppTab,
  session: Session,
  onNewPlant: () => void,
  onSessionUpdated: (nextSession: Session) => void,
  onAccountDeleted: () => void,
  onExploreTag: (tag: string) => void,
  onOpenLeafDetails: (leafId: number) => void,
  onCloseLeafDetails: () => void,
  selectedLeafId?: number,
  selectedLeafVersion?: number,
  collectionSearchKeyword?: string,
  collectionSearchTags?: string[],
  collectionSearchVersion?: number,
  exploreSearchKeyword?: string,
  exploreSearchTags?: string[],
  exploreSearchVersion?: number,
  explorePrefillTag?: string,
  explorePrefillVersion?: number
): React.JSX.Element {
  if (tab === 'home') {
    if (selectedLeafId) {
      return (
        <PlantDetailsScreen
          session={session}
          leafId={selectedLeafId}
          leafVersion={selectedLeafVersion}
          onBack={onCloseLeafDetails}
          onExploreTag={onExploreTag}
          onDeleted={onCloseLeafDetails}
        />
      );
    }

    return (
      <CollectionScreen
        session={session}
        onOpenLeafDetails={onOpenLeafDetails}
        globalSearchKeyword={collectionSearchKeyword}
        globalSearchTags={collectionSearchTags}
        globalSearchVersion={collectionSearchVersion}
      />
    );
  }

  if (tab === 'lens') {
    return <AnalyzeScreen session={session} onExploreTag={onExploreTag} />;
  }

  if (tab === 'history') {
    return <HistoryScreen session={session} onOpenLeafDetails={onOpenLeafDetails} />;
  }

  if (tab === 'explore') {
    return (
      <ExploreScreen
        session={session}
        preselectedTag={explorePrefillTag}
        preselectedTagVersion={explorePrefillVersion}
        globalSearchKeyword={exploreSearchKeyword}
        globalSearchTags={exploreSearchTags}
        globalSearchVersion={exploreSearchVersion}
      />
    );
  }

  if (tab === 'profile') {
    return <ProfileScreen session={session} onSessionUpdated={onSessionUpdated} onAccountDeleted={onAccountDeleted} />;
  }

  return <AboutScreen onNewPlant={onNewPlant} />;
}

export default function App(): React.JSX.Element {
  const [session, setSession] = useState<Session | undefined>();
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [selectedLeafId, setSelectedLeafId] = useState<number | undefined>();
  const [selectedLeafVersion, setSelectedLeafVersion] = useState(0);
  const [globalSearchVisible, setGlobalSearchVisible] = useState(false);
  const [globalSearchKeyword, setGlobalSearchKeyword] = useState('');
  const [globalSearchScope, setGlobalSearchScope] = useState<GlobalSearchScope>('collection');
  const [globalSearchSelectedTags, setGlobalSearchSelectedTags] = useState<string[]>([]);
  const [globalSearchAvailableTags, setGlobalSearchAvailableTags] = useState<string[]>([]);
  const [globalSearchTagsLoading, setGlobalSearchTagsLoading] = useState(false);
  const [globalSearchTagsError, setGlobalSearchTagsError] = useState('');
  const [collectionSearchKeyword, setCollectionSearchKeyword] = useState('');
  const [collectionSearchTags, setCollectionSearchTags] = useState<string[]>([]);
  const [collectionSearchVersion, setCollectionSearchVersion] = useState(0);
  const [exploreSearchKeyword, setExploreSearchKeyword] = useState('');
  const [exploreSearchTags, setExploreSearchTags] = useState<string[]>([]);
  const [exploreSearchVersion, setExploreSearchVersion] = useState(0);
  const [explorePrefillTag, setExplorePrefillTag] = useState<string | undefined>();
  const [explorePrefillVersion, setExplorePrefillVersion] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const lastGestureTimestampRef = useRef(0);
  const [iconsLoaded, iconsLoadError] = useFonts({
    ...Feather.font,
    ...Ionicons.font,
    ...MaterialCommunityIcons.font
  });
  const [fontFallbackReady, setFontFallbackReady] = useState(false);

  const welcomeText = session ? session.userName : 'Guest';
  const headerTopPadding = Platform.OS === 'android' ? (NativeStatusBar.currentHeight ?? 0) + 8 : 8;

  useEffect(() => {
    if (iconsLoaded || iconsLoadError) {
      setFontFallbackReady(true);
      return;
    }

    const timer = setTimeout(() => {
      setFontFallbackReady(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [iconsLoaded, iconsLoadError]);

  function handleLogout(): void {
    setSession(undefined);
    setSelectedLeafId(undefined);
    setGlobalSearchKeyword('');
    setGlobalSearchSelectedTags([]);
    setGlobalSearchAvailableTags([]);
    setGlobalSearchTagsError('');
    setGlobalSearchScope('collection');
    setGlobalSearchVisible(false);
    setActiveTab('home');
    setMenuVisible(false);
  }

  function handleMenuSelect(itemKey: MenuItem['key']): void {
    if (itemKey === 'logout') {
      handleLogout();
      return;
    }

    if (itemKey === 'home') {
      setSelectedLeafId(undefined);
    }

    setActiveTab(itemKey);
    setGlobalSearchVisible(false);
    setMenuVisible(false);
  }

  function handleExploreTag(tag: string): void {
    const normalized = tag.trim().toLowerCase();
    if (!normalized) {
      return;
    }

    setExplorePrefillTag(normalized);
    setExplorePrefillVersion((value) => value + 1);
    setActiveTab('explore');
    setGlobalSearchVisible(false);
    setMenuVisible(false);
  }

  function handleOpenLeafDetails(leafId: number): void {
    setSelectedLeafId(leafId);
    setSelectedLeafVersion((value) => value + 1);
    setActiveTab('home');
    setGlobalSearchVisible(false);
    setMenuVisible(false);
  }

  function handleCloseLeafDetails(): void {
    setSelectedLeafId(undefined);
  }

  async function loadGlobalTags(scope: GlobalSearchScope): Promise<void> {
    if (!session) {
      setGlobalSearchAvailableTags([]);
      setGlobalSearchTagsError('');
      return;
    }

    setGlobalSearchTagsLoading(true);
    setGlobalSearchTagsError('');

    try {
      if (scope === 'collection') {
        const tags = await getUserTags(session.userId, session.token);
        setGlobalSearchAvailableTags(tags);
        return;
      }

      const leaves = await exploreLeaves(session.token);
      const countByTag = new Map<string, number>();

      leaves.forEach((leaf) => {
        (leaf.tags ?? []).forEach((rawTag) => {
          const normalized = String(rawTag).trim().toLowerCase();
          if (!normalized) {
            return;
          }

          countByTag.set(normalized, (countByTag.get(normalized) ?? 0) + 1);
        });
      });

      const sortedTags = [...countByTag.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([tag]) => tag)
        .slice(0, 12);

      setGlobalSearchAvailableTags(sortedTags);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load tags.';
      setGlobalSearchTagsError(message);
      setGlobalSearchAvailableTags([]);
    } finally {
      setGlobalSearchTagsLoading(false);
    }
  }

  function openGlobalSearch(): void {
    setMenuVisible(false);
    const nextScope: GlobalSearchScope = activeTab === 'explore' ? 'explore' : 'collection';

    setGlobalSearchScope(nextScope);
    setGlobalSearchKeyword(nextScope === 'explore' ? exploreSearchKeyword : collectionSearchKeyword);
    setGlobalSearchSelectedTags(nextScope === 'explore' ? exploreSearchTags : collectionSearchTags);
    setGlobalSearchVisible(true);
    void loadGlobalTags(nextScope);
  }

  function toggleGlobalSearchScope(): void {
    setGlobalSearchScope((current) => {
      const nextScope: GlobalSearchScope = current === 'explore' ? 'collection' : 'explore';

      setGlobalSearchKeyword(nextScope === 'explore' ? exploreSearchKeyword : collectionSearchKeyword);
      setGlobalSearchSelectedTags(nextScope === 'explore' ? exploreSearchTags : collectionSearchTags);
      void loadGlobalTags(nextScope);

      return nextScope;
    });
  }

  function toggleGlobalTag(tag: string): void {
    setGlobalSearchSelectedTags((current) => {
      if (current.includes(tag)) {
        return current.filter((entry) => entry !== tag);
      }

      return [...current, tag];
    });
  }

  function runGlobalSearch(): void {
    if (globalSearchScope === 'explore') {
      openPublicExploreSearch();
      return;
    }

    openCollectionSearch();
  }

  function openCollectionSearch(): void {
    const nextKeyword = globalSearchKeyword.trim();
    const nextTags = [...globalSearchSelectedTags];
    setCollectionSearchKeyword(nextKeyword);
    setCollectionSearchTags(nextTags);
    setCollectionSearchVersion((value) => value + 1);
    setSelectedLeafId(undefined);
    setActiveTab('home');
    setGlobalSearchVisible(false);
  }

  function openPublicExploreSearch(): void {
    const nextKeyword = globalSearchKeyword.trim();
    const nextTags = [...globalSearchSelectedTags];
    setExploreSearchKeyword(nextKeyword);
    setExploreSearchTags(nextTags);
    setExploreSearchVersion((value) => value + 1);
    setActiveTab('explore');
    setGlobalSearchVisible(false);
  }

  function canRunGesture(): boolean {
    const now = Date.now();
    if (now - lastGestureTimestampRef.current < GESTURE_COOLDOWN_MS) {
      return false;
    }

    lastGestureTimestampRef.current = now;
    return true;
  }

  function openMenuFromGesture(): void {
    if (menuVisible || !canRunGesture()) {
      return;
    }

    setMenuVisible(true);
  }

  function closeMenuFromGesture(): void {
    if (!menuVisible || !canRunGesture()) {
      return;
    }

    setMenuVisible(false);
  }

  const panResponder = createEdgeMenuPanResponder({
    menuVisible,
    onOpenMenu: openMenuFromGesture,
    onCloseMenu: closeMenuFromGesture
  });

  const canRenderApp = iconsLoaded || Boolean(iconsLoadError) || fontFallbackReady;

  const appContent = !canRenderApp ? (
    <SafeAreaView style={styles.root}>
      <ExpoStatusBar style="dark" />
      <View style={styles.startupWrap}>
        <Text style={styles.startupText}>Loading app...</Text>
      </View>
    </SafeAreaView>
  ) : !session ? (
    <SafeAreaView style={styles.root}>
      <ExpoStatusBar style="dark" />
      <AuthScreen onAuthenticated={setSession} />
    </SafeAreaView>
  ) : (
    <SafeAreaView style={styles.root} {...panResponder.panHandlers}>
      <ExpoStatusBar style="dark" />

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

      <Modal visible={globalSearchVisible} transparent animationType="fade" onRequestClose={() => setGlobalSearchVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setGlobalSearchVisible(false)}>
          <Pressable style={[styles.searchOverlaySheet, { paddingTop: headerTopPadding + 56 }]} onPress={() => undefined}>
            <View style={styles.searchBarCard}>
              <Pressable style={styles.searchRoundButton} onPress={() => setGlobalSearchVisible(false)}>
                <Feather name="x" size={28} color="#111111" />
              </Pressable>

              <TextInput
                style={styles.searchBarInput}
                placeholder="Search..."
                placeholderTextColor="#b0b5bc"
                value={globalSearchKeyword}
                onChangeText={setGlobalSearchKeyword}
                returnKeyType="search"
                autoFocus
                onSubmitEditing={runGlobalSearch}
              />

              <Pressable style={styles.searchRoundButton} onPress={runGlobalSearch}>
                <Feather name="search" size={28} color="#111111" />
              </Pressable>
            </View>

            <View style={styles.searchFilterCard}>
              <View style={styles.searchFilterHeaderRow}>
                <View style={styles.searchFilterTitleWrap}>
                  <Feather name="sliders" size={34} color="#4b5563" />
                  <Text style={styles.searchFilterTitle}>Filters</Text>
                </View>

                <Pressable
                  style={[styles.searchScopeButton, globalSearchScope === 'explore' && styles.searchScopeButtonActive]}
                  onPress={toggleGlobalSearchScope}
                >
                  <Feather
                    name={globalSearchScope === 'explore' ? 'compass' : 'home'}
                    size={22}
                    color={globalSearchScope === 'explore' ? '#0b3f1d' : '#111827'}
                  />
                  <Text style={[styles.searchScopeButtonText, globalSearchScope === 'explore' && styles.searchScopeButtonTextActive]}>
                    {globalSearchScope === 'explore' ? 'Explore' : 'Collection'}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.searchScopeDescription}>
                {globalSearchScope === 'explore'
                  ? 'Explore mode is active. Refine results with tags below.'
                  : 'Collection mode is active. Search runs on your saved plants.'}
              </Text>

              <View style={styles.searchTagGrid}>
                {globalSearchTagsLoading ? (
                  <Text style={styles.searchTagHelperText}>Loading filters...</Text>
                ) : globalSearchAvailableTags.length > 0 ? (
                  globalSearchAvailableTags.map((tag) => {
                    const selected = globalSearchSelectedTags.includes(tag);

                    return (
                      <Pressable
                        key={tag}
                        style={[styles.searchTagPill, selected && styles.searchTagPillActive]}
                        onPress={() => toggleGlobalTag(tag)}
                      >
                        <Text style={[styles.searchTagPillText, selected && styles.searchTagPillTextActive]}>{tag}</Text>
                      </Pressable>
                    );
                  })
                ) : (
                  <Text style={styles.searchTagHelperText}>No filters available.</Text>
                )}
              </View>

              {globalSearchTagsError.length > 0 && <Text style={styles.searchTagErrorText}>{globalSearchTagsError}</Text>}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={[styles.header, { paddingTop: headerTopPadding }]}>
        <Pressable style={styles.circleIconButton} onPress={() => setMenuVisible(true)}>
          <Feather name="menu" size={24} color="#1f2937" />
        </Pressable>

        <View style={styles.brandWrap}>
          <Text style={styles.brandLine1}>LEAFLENS</Text>
          <Text style={styles.brandLine2}>{welcomeText}</Text>
        </View>

        <Pressable style={styles.circleIconButton} onPress={openGlobalSearch}>
          <Feather name="search" size={22} color="#1f2937" />
        </Pressable>
      </View>

      <View style={styles.content}>
        {renderActiveTab(
          activeTab,
          session,
          () => setActiveTab('lens'),
          (nextSession) => setSession(nextSession),
          handleLogout,
          handleExploreTag,
          handleOpenLeafDetails,
          handleCloseLeafDetails,
          selectedLeafId,
          selectedLeafVersion,
          collectionSearchKeyword,
          collectionSearchTags,
          collectionSearchVersion,
          exploreSearchKeyword,
          exploreSearchTags,
          exploreSearchVersion,
          explorePrefillTag,
          explorePrefillVersion
        )}
      </View>

      <View style={styles.bottomNavWrap}>
        <View style={styles.bottomNav}>
          <Pressable
            style={[styles.navButton, activeTab === 'home' && styles.navButtonActive]}
            onPress={() => {
              setSelectedLeafId(undefined);
              setActiveTab('home');
            }}
          >
            <Ionicons name="home-outline" size={26} color={activeTab === 'home' ? '#111827' : '#6b7280'} />
            <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>Home</Text>
          </Pressable>
          <Pressable style={[styles.navButton, activeTab === 'lens' && styles.navButtonActive]} onPress={() => setActiveTab('lens')}>
            <MaterialCommunityIcons name="leaf" size={26} color={activeTab === 'lens' ? '#111827' : '#6b7280'} />
            <Text style={[styles.navLabel, activeTab === 'lens' && styles.navLabelActive]}>Analyze</Text>
          </Pressable>
          <Pressable style={[styles.navButton, activeTab === 'history' && styles.navButtonActive]} onPress={() => setActiveTab('history')}>
            <Feather name="list" size={26} color={activeTab === 'history' ? '#111827' : '#6b7280'} />
            <Text style={[styles.navLabel, activeTab === 'history' && styles.navLabelActive]}>History</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );

  return <AppModalProvider>{appContent}</AppModalProvider>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ece1dd'
  },
  header: {
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
  startupWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  startupText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600'
  },
  bottomNavWrap: {
    backgroundColor: '#f6f6f6',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch'
  },
  navButton: {
    flex: 1,
    minHeight: 58,
    marginHorizontal: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2
  },
  navButtonActive: {
    backgroundColor: '#dfeedd'
  },
  navLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700'
  },
  navLabelActive: {
    color: '#111827'
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
  },
  searchOverlaySheet: {
    paddingHorizontal: 16,
    gap: 10
  },
  searchBarCard: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 4
  },
  searchRoundButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#f1e5df',
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchBarInput: {
    flex: 1,
    minHeight: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#d5d8dd',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 24,
    color: '#111827',
    fontSize: 19,
    fontWeight: '500'
  },
  searchFilterCard: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 3
  },
  searchFilterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  searchFilterTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  searchFilterTitle: {
    color: '#1f2937',
    fontSize: 45 / 2,
    fontWeight: '400'
  },
  searchScopeButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#eef2f7',
    paddingHorizontal: 18,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  searchScopeButtonActive: {
    backgroundColor: '#67ce65',
    borderColor: '#56b856'
  },
  searchScopeButtonText: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '500'
  },
  searchScopeButtonTextActive: {
    color: '#0b3f1d',
    fontWeight: '700'
  },
  searchScopeDescription: {
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 24
  },
  searchTagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  searchTagPill: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#b7b7b7',
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  searchTagPillActive: {
    backgroundColor: '#d4efce',
    borderColor: '#70c95b'
  },
  searchTagPillText: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '600'
  },
  searchTagPillTextActive: {
    color: '#14532d',
    fontWeight: '700'
  },
  searchTagHelperText: {
    color: '#6b7280',
    fontSize: 14
  },
  searchTagErrorText: {
    color: '#dc2626',
    fontSize: 13
  }
});
