import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Drawer from "@/components/Drawer";
import EditLabelsModal from "@/components/EditLabelsModal";
import Fab from "@/components/Fab";
import Icon from "@/components/Icon";
import NoteDialog from "@/components/NoteDialog";
import { SettingsButton, SettingsDialog } from "@/components/SettingsMenu";
import Sidebar from "@/components/Sidebar";
import Snackbar from "@/components/Snackbar";
import Tip from "@/components/Tip";
import { useIsWide } from "@/hooks/useColumns";
import { useTheme } from "@/hooks/useTheme";
import { archiveNotes, pinNotes, trashNotes } from "@/lib/noteActions";
import { useNotes } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";

const noOutline = Platform.select({ web: { outlineStyle: "none" }, default: {} });

// Replaces the header while notes are selected: count + pin / archive / delete.
function SelectionBar() {
  const c = useTheme();
  const pathname = usePathname();
  const selected = useSettings((s) => s.selected);
  const clearSelection = useSettings((s) => s.clearSelection);

  // actions finish the selection
  const run = (action) => () => {
    action(selected);
    clearSelection();
  };

  return (
    <View style={[styles.header, { borderBottomColor: c.border, backgroundColor: c.active }]}>
      <Tip label="Clear selection">
        <Pressable onPress={clearSelection} hitSlop={8}>
          <Icon name="close" size={24} color={c.text} />
        </Pressable>
      </Tip>
      <Text style={[styles.count, { color: c.text }]}>{selected.length}</Text>
      <View style={styles.flex} />
      <Tip label="Pin">
        <Pressable onPress={run(pinNotes)} hitSlop={8}>
          <Icon name="pin-outline" size={24} color={c.text} />
        </Pressable>
      </Tip>
      <Tip label={pathname === "/archive" ? "Unarchive" : "Archive"}>
        <Pressable onPress={run(archiveNotes)} hitSlop={8}>
          <Icon
            name={pathname === "/archive" ? "unarchive" : "archive"}
            size={24}
            color={c.text}
          />
        </Pressable>
      </Tip>
      <Tip label="Delete">
        <Pressable onPress={run(trashNotes)} hitSlop={8}>
          <Icon name="delete-outline" size={24} color={c.text} />
        </Pressable>
      </Tip>
    </View>
  );
}

function Header({ wide }) {
  const c = useTheme();
  const query = useSettings((s) => s.query);
  const setQuery = useSettings((s) => s.setQuery);
  const layout = useSettings((s) => s.layout);
  const toggleLayout = useSettings((s) => s.toggleLayout);
  const setDrawerOpen = useSettings((s) => s.setDrawerOpen);
  const toggleSidebar = useSettings((s) => s.toggleSidebar);

  return (
    <View style={[styles.header, { borderBottomColor: c.border }]}>
      {/* left: menu button (collapses the sidebar on desktop, opens the drawer on phones) */}
      <Tip label="Main menu">
        <Pressable onPress={wide ? toggleSidebar : () => setDrawerOpen(true)} hitSlop={8}>
          <Icon name="menu" size={26} color={c.text} />
        </Pressable>
      </Tip>
      {wide && (
        <View style={styles.brand}>
          <Icon name="lightbulb" size={30} color="#fbbc04" />
          <Text style={[styles.logo, { color: c.text }]}>Keep</Text>
        </View>
      )}

      <View style={[styles.search, wide && styles.searchWide, { backgroundColor: c.input }]}>
        <Icon name="search" size={20} color={c.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={wide ? "Search" : "Search your notes"}
          placeholderTextColor={c.muted}
          style={[styles.searchInput, noOutline, { color: c.text }]}
        />
        {!!query && (
          <Tip label="Clear search">
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Icon name="close" size={18} color={c.muted} />
            </Pressable>
          </Tip>
        )}
      </View>

      {/* pushes the buttons to the far right on wide screens */}
      {wide && <View style={styles.flex} />}

      <Tip label={layout === "grid" ? "List view" : "Grid view"}>
        <Pressable onPress={toggleLayout} hitSlop={8}>
          <Icon
            name={layout === "grid" ? "view-agenda" : "view-module"}
            size={24}
            color={c.muted}
          />
        </Pressable>
      </Tip>
      <SettingsButton />
    </View>
  );
}

export default function RootLayout() {
  const c = useTheme();
  const wide = useIsWide();
  const pathname = usePathname();
  const inEditor = pathname.startsWith("/note/");
  const purgeOldTrash = useNotes((s) => s.purgeOldTrash);
  const selecting = useSettings((s) => s.selected.length > 0);
  const clearSelection = useSettings((s) => s.clearSelection);
  const sidebarOpen = useSettings((s) => s.sidebarOpen);

  useEffect(() => {
    // wait for AsyncStorage to load the saved notes before purging
    const run = () => purgeOldTrash();
    if (useNotes.persist.hasHydrated()) run();
    else return useNotes.persist.onFinishHydration(run);
  }, [purgeOldTrash]);

  // switching screens drops the selection
  useEffect(() => {
    clearSelection();
  }, [pathname, clearSelection]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]} edges={["top"]}>
      <StatusBar style={c.dark ? "light" : "dark"} />
      {!inEditor && (selecting ? <SelectionBar /> : <Header wide={wide} />)}
      <View style={styles.body}>
        {wide && <Sidebar collapsed={!sidebarOpen} />}
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
      {!wide && !inEditor && !selecting && <Fab />}
      <Snackbar />
      {wide ? <NoteDialog /> : <Drawer />}
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
  brand: { flexDirection: "row", alignItems: "center", gap: 8, minWidth: 130 },
  logo: { fontSize: 22, fontWeight: "500" },
  count: { fontSize: 18, fontWeight: "600" },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  searchWide: { flexGrow: 1, maxWidth: 720 },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  body: { flex: 1, flexDirection: "row" },
});
