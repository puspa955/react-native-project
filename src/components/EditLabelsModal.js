import { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Icon from "@/components/Icon";
import Sheet from "@/components/Sheet";
import Tip from "@/components/Tip";
import { useTheme } from "@/hooks/useTheme";
import { confirmDelete } from "@/lib/confirm";
import { useNotes } from "@/store/notesStore";
import { useSettings } from "@/store/settingsStore";

const noOutline = Platform.select({ web: { outlineStyle: "none" }, default: {} });

// "Edit labels" dialog: create, rename and delete labels. Opened from the sidebar / Labels screen.
export default function EditLabelsModal() {
  const c = useTheme();
  const open = useSettings((s) => s.labelsModalOpen);
  const setOpen = useSettings((s) => s.setLabelsModalOpen);
  const labels = useNotes((s) => s.labels);
  const addLabel = useNotes((s) => s.addLabel);
  const renameLabel = useNotes((s) => s.renameLabel);
  const deleteLabel = useNotes((s) => s.deleteLabel);
  const [draft, setDraft] = useState("");

  const create = () => {
    addLabel(draft);
    setDraft("");
  };

  return (
    <Sheet visible={open} onClose={() => setOpen(false)} title="Edit labels">
      <View style={[styles.row, { borderBottomColor: c.border }]}>
        <Icon name="add" size={20} color={c.muted} />
        <TextInput
          autoFocus
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={create}
          placeholder="Create new label"
          placeholderTextColor={c.muted}
          style={[styles.input, noOutline, { color: c.text }]}
        />
        {!!draft.trim() && (
          <Pressable onPress={create} hitSlop={8}>
            <Text style={{ color: c.link, fontWeight: "600" }}>Create</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.list}>
        {labels.length === 0 && (
          <Text style={{ color: c.muted, paddingVertical: 8 }}>No labels yet</Text>
        )}
        {labels.map((l) => (
          <View key={l.id} style={styles.row}>
            <Icon name="label-outline" size={20} color={c.muted} />
            {/* defaultValue + onEndEditing: the name is saved when you leave the field */}
            <TextInput
              defaultValue={l.name}
              onEndEditing={(e) => renameLabel(l.id, e.nativeEvent.text)}
              style={[styles.input, noOutline, { color: c.text }]}
            />
            <Tip label="Delete label">
              <Pressable
                hitSlop={8}
                onPress={() =>
                  confirmDelete(
                    `Delete "${l.name}"?`,
                    "The label is removed from your notes. The notes themselves are kept.",
                    () => deleteLabel(l.id)
                  )
                }
              >
                <Icon name="delete-outline" size={20} color={c.muted} />
              </Pressable>
            </Tip>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={() => setOpen(false)}>
          <Text style={{ color: c.text, fontWeight: "600", padding: 4 }}>Done</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 40,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "transparent",
  },
  input: { flex: 1, fontSize: 15, padding: 0, paddingVertical: 8 },
  list: { flexGrow: 0 },
  footer: { flexDirection: "row", justifyContent: "flex-end" },
});
