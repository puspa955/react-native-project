import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomBar from "@/components/BottomBar";
import EditLabelsModal from "@/components/EditLabelsModal";
import Sidebar from "@/components/Sidebar";
import { useIsWide } from "@/hooks/useColumns";
import { useTheme } from "@/hooks/useTheme";
import { useNotes } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";

const noOutline = Platform.select({ web: { outlineStyle: "none" }, default: {} });

function Header() {
  const c = useTheme();
  const query = useSettings((s) => s.query);
  const setQuery = useSettings((s) => s.setQuery);

  return (
    <View style={[styles.header, { borderBottomColor: c.border }]}>
      <Text style={styles.logo}>Keep</Text>
      <View style={[styles.search, { backgroundColor: c.input }]}>
        <Text style={{ color: c.muted }}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={c.muted}
          style={[styles.searchInput, noOutline, { color: c.text }]}
        />
        {!!query && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Text style={{ color: c.muted }}>✕</Text>
          </Pressable>
        )}
      </View>
      <Pressable onPress={c.toggle} hitSlop={8}>
        <Text style={styles.toggle}>{c.dark ? "☀️" : "🌙"}</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const c = useTheme();
  const wide = useIsWide();
  const pathname = usePathname();
  const inEditor = pathname.startsWith("/note/");
  const purgeOldTrash = useNotes((s) => s.purgeOldTrash);

  useEffect(() => {
    // wait for AsyncStorage to load the saved notes before purging
    const run = () => purgeOldTrash();
    if (useNotes.persist.hasHydrated()) run();
    else return useNotes.persist.onFinishHydration(run);
  }, [purgeOldTrash]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]} edges={["top"]}>
      <StatusBar style={c.dark ? "light" : "dark"} />
      {!inEditor && <Header />}
      <View style={styles.body}>
        {wide && <Sidebar />}
        <View style={styles.content}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "none",
              contentStyle: { backgroundColor: c.bg },
            }}
          />
        </View>
      </View>
      {!wide && !inEditor && <BottomBar />}
      <EditLabelsModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  logo: { fontSize: 22, color: "#f9ab00", fontWeight: "700" },
  search: {
    flex: 1,
    maxWidth: 600,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  toggle: { fontSize: 20 },
  body: { flex: 1, flexDirection: "row" },
  content: { flex: 1 },
});
