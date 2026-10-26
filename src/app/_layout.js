import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Drawer from "@/components/Drawer";
import EditLabelsModal from "@/components/EditLabelsModal";
import Fab from "@/components/Fab";
import Brand from "@/components/Brand";
import Icon from "@/components/Icon";
import { FilterPanel, usePickedFilterName } from "@/components/SearchFilters";
import SelectionBar from "@/components/SelectionBar";
import SortMenu from "@/components/SortMenu";
import NoteDialog from "@/components/NoteDialog";
import { SettingsButton, SettingsDialog } from "@/components/SettingsMenu";
import Sidebar from "@/components/Sidebar";
import Snackbar from "@/components/Snackbar";
import Tip from "@/components/Tip";
import { useHasSidebar } from "@/hooks/useColumns";
import { useDebouncedValue } from "@/hooks/useDebounce";
import { IS_WEB } from "@/lib/platform";
import { useTheme } from "@/hooks/useTheme";
import { hasActiveFilters, useNotes } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";

const noOutline = Platform.select({ web: { outlineStyle: "none" }, default: {} });

function Header({ hasSidebar }) {
  const c = useTheme();
  // Phones (the app, or a phone-sized web window) get a compact header: icons only, and a search
  // icon that opens a full-screen search. Wide screens keep the search box in the header.
  const compact = !hasSidebar;
  const query = useSettings((s) => s.query);
  const setQuery = useSettings((s) => s.setQuery);
  // The box shows what you type right away; the notes are only filtered once you pause typing
  // (300 ms), so we do not re-filter every note on every keystroke.
  const [text, setText] = useState(query);
  const debouncedText = useDebouncedValue(text, 300);
  useEffect(() => {
    setQuery(debouncedText);
  }, [debouncedText, setQuery]);
  const layout = useSettings((s) => s.layout);
  const toggleLayout = useSettings((s) => s.toggleLayout);
  const setDrawerOpen = useSettings((s) => s.setDrawerOpen);
  const toggleSidebar = useSettings((s) => s.toggleSidebar);
  const searchOpen = useSettings((s) => s.searchOpen);
  const setSearchOpen = useSettings((s) => s.setSearchOpen);
  const clearFilters = useSettings((s) => s.clearFilters);
  const pickedName = usePickedFilterName();
  const searchRef = useRef(null);
  const [focused, setFocused] = useState(false); // wide screens: the search box has the cursor

  // leaving the full-screen search empties the box
  useEffect(() => {
    if (!searchOpen) setText("");
  }, [searchOpen]);

  const clearText = () => {
    setText("");
    setQuery(""); // clearing applies at once, no need to wait
  };
  // the cross: first empties the typed text, then leaves the "search within" filter
  const clearSearch = () => (text ? clearText() : clearFilters());
  const closeSearch = () => {
    clearText();
    clearFilters();
    setSearchOpen(false);
  };

  // phones, search open: the header is just a back arrow and the search box
  if (compact && searchOpen) {
    return (
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Tip label="Back">
          <Pressable onPress={closeSearch} hitSlop={8}>
            <Icon name="arrow-back" size={24} color={c.text} />
          </Pressable>
        </Tip>
        <TextInput
          autoFocus
          value={text}
          onChangeText={setText}
          placeholder={pickedName ? `Search within ${pickedName}` : "Search your notes"}
          placeholderTextColor={c.muted}
          style={[styles.searchInput, noOutline, { color: c.text, fontSize: 17 }]}
        />
        {(!!text || !!pickedName) && (
          <Pressable onPress={clearSearch} hitSlop={8}>
            <Icon name="close" size={22} color={c.muted} />
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.header, { borderBottomColor: c.border }]}>
      {/* left: menu button (collapses the sidebar on desktop, opens the drawer on phones) */}
      <Tip label="Main menu">
        <Pressable onPress={hasSidebar ? toggleSidebar : () => setDrawerOpen(true)} hitSlop={8}>
          <Icon name="menu" size={26} color={c.text} />
        </Pressable>
      </Tip>
      <Brand />

      {compact ? (
        <>
          <View style={styles.flex} />
          <Tip label="Search">
            <Pressable onPress={() => setSearchOpen(true)} hitSlop={8} accessibilityLabel="Search">
              <Icon name="search" size={24} color={c.muted} />
            </Pressable>
          </Tip>
        </>
      ) : (
        // wide screens: the search box. While it has the cursor, the filter panel (types, colours,
        // labels) drops down under it. The panel ignores mouse-downs so clicking a filter does
        // not take the cursor out of the box, which would close the panel.
        <View style={styles.searchWrap}>
          <View style={[styles.searchBar, { backgroundColor: c.input }]}>
            <Icon name="search" size={20} color={c.muted} />
            <TextInput
              value={text}
              onChangeText={setText}
              ref={searchRef}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={pickedName ? `Search within ${pickedName}` : "Search"}
              placeholderTextColor={c.muted}
              style={[styles.searchInput, noOutline, { color: c.text }]}
            />
            {(!!text || !!pickedName) && (
              <Tip label="Clear search">
                <Pressable onPress={clearSearch} hitSlop={8}>
                  <Icon name="close" size={18} color={c.muted} />
                </Pressable>
              </Tip>
            )}
          </View>
          {focused && !pickedName && (
            <View
              onMouseDown={(e) => e.preventDefault()}
              style={[styles.dropdown, { backgroundColor: c.surface, borderColor: c.border }]}
            >
              <FilterPanel onPick={() => searchRef.current?.blur()} />
            </View>
          )}
        </View>
      )}

      {/* pushes the buttons to the far right when there is room */}
      {hasSidebar && <View style={styles.flex} />}

      <Tip label={layout === "grid" ? "List view" : "Grid view"}>
        <Pressable onPress={toggleLayout} hitSlop={8}>
          <Icon
            name={layout === "grid" ? "view-agenda" : "view-module"}
            size={24}
            color={c.muted}
          />
        </Pressable>
      </Tip>
      <SortMenu />
      <SettingsButton />
    </View>
  );
}

export default function RootLayout() {
  const c = useTheme();
  const hasSidebar = useHasSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const inEditor = pathname.startsWith("/note/");
  const purgeOldTrash = useNotes((s) => s.purgeOldTrash);
  const purgeEmpty = useNotes((s) => s.purgeEmpty);
  const selecting = useSettings((s) => s.selected.length > 0);
  const clearSelection = useSettings((s) => s.clearSelection);
  const sidebarOpen = useSettings((s) => s.sidebarOpen);
  const searchOpen = useSettings((s) => s.searchOpen);
  const query = useSettings((s) => s.query);
  const filters = useSettings((s) => s.filters);
  // phones: the full-screen search is open
  const phoneSearch = !hasSidebar && searchOpen;
  // ...and nothing is typed or picked yet, so we show the filter suggestions instead of the notes
  const showSuggestions = phoneSearch && query.trim() === "" && !hasActiveFilters(filters);

  useEffect(() => {
    // wait for AsyncStorage to load the saved notes before purging
    const run = () => {
      purgeOldTrash();
      purgeEmpty();
    };
    if (useNotes.persist.hasHydrated()) run();
    else return useNotes.persist.onFinishHydration(run);
  }, [purgeOldTrash, purgeEmpty]);

  // Android's Back button. Reminders, Archive, Trash and the label pages are top-level
  // destinations of the menu, like in Keep, so Back from them goes to Notes, not to whichever
  // screen you opened before. On Notes itself Back leaves the app as usual, and in the note
  // editor it goes back to the screen the note was opened from. (The web keeps the browser's
  // own Back behaviour.)
  useEffect(() => {
    if (IS_WEB) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      const { selected, clearSelection: clear } = useSettings.getState();
      if (selected.length > 0) {
        clear(); // first Back just leaves selection mode
        return true;
      }
      const st = useSettings.getState();
      if (st.searchOpen) {
        st.setQuery(""); // Back closes the search first
        st.clearFilters();
        st.setSearchOpen(false);
        return true;
      }
      if (inEditor || pathname === "/") return false;
      router.navigate("/");
      return true;
    });
    return () => sub.remove();
  }, [pathname, inEditor, router]);

  // switching screens drops the selection
  useEffect(() => {
    clearSelection();
  }, [pathname, clearSelection]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]} edges={["top"]}>
      <StatusBar style={c.dark ? "light" : "dark"} />
      {!inEditor && (selecting ? <SelectionBar /> : <Header hasSidebar={hasSidebar} />)}
      <View style={styles.body}>
        {/* phone search, before anything is typed: the filters cover the notes */}
        {showSuggestions && (
          <ScrollView
            style={[StyleSheet.absoluteFill, { backgroundColor: c.bg, zIndex: 5 }]}
            keyboardShouldPersistTaps="handled"
          >
            <FilterPanel />
          </ScrollView>
        )}
        {hasSidebar && <Sidebar collapsed={!sidebarOpen} />}
        <View style={styles.flex}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "none",
              contentStyle: { backgroundColor: c.bg },
            }}
          />
        </View>
      </View>
      {!IS_WEB && !inEditor && !selecting && !phoneSearch && <Fab />}
      <Snackbar />
      {IS_WEB && <NoteDialog />}
      {!hasSidebar && <Drawer />}
      <EditLabelsModal />
      <SettingsDialog />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    zIndex: 10, // so tooltips drawn below the header stay on top of the notes
  },
  count: { fontSize: 18, fontWeight: "600" },
  // wide screens: the search box and the dropdown under it
  searchWrap: { marginLeft: 32, flexGrow: 1, flexShrink: 1, flexBasis: 0, maxWidth: 720, position: "relative", zIndex: 30 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdown: {
    position: "absolute",
    top: 46,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 40,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  searchInput: { flex: 1, minWidth: 60, fontSize: 15, padding: 0 },
  body: { flex: 1, flexDirection: "row" },
});
