import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomBar from "@/components/BottomBar";
import Sidebar from "@/components/Sidebar";
import { useIsWide } from "@/hooks/useColumns";
import { useNotes } from "@/store/notesStore";
import { colors } from "@/theme";

const TITLES = { "/": "Notes", "/archive": "Archive", "/trash": "Trash" };

export default function RootLayout() {
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
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="dark" />
      {!inEditor && (
        <View style={styles.header}>
          <Text style={styles.logo}>Keep</Text>
          <Text style={styles.title}>{TITLES[pathname] ?? ""}</Text>
        </View>
      )}
      <View style={styles.body}>
        {wide && <Sidebar />}
        <View style={styles.content}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "none",
              contentStyle: { backgroundColor: colors.bg },
            }}
          />
        </View>
      </View>
      {!wide && !inEditor && <BottomBar />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { fontSize: 22, color: "#f9ab00", fontWeight: "700" },
  title: { fontSize: 16, color: colors.muted },
  body: { flex: 1, flexDirection: "row" },
  content: { flex: 1 },
});
