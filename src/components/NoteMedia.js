import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { DrawingView } from "@/components/Drawing";
import Icon from "@/components/Icon";
import Tip from "@/components/Tip";
import { useTheme } from "@/hooks/useTheme";
import { useNotes } from "@/store/notesStore";

const GAP = 4;
const MAX_ON_CARD = 4;

function RemoveButton({ label, onPress }) {
  return (
    <Tip label={label} style={styles.remove}>
      <Pressable onPress={onPress} hitSlop={6} style={styles.removeBtn} accessibilityLabel={label}>
        <Icon name="close" size={16} color="#ffffff" />
      </Pressable>
    </Tip>
  );
}

// Images + drawings of a note. On a card (`editable` false) images are shown as a compact grid;
// in the editor (`editable` true) each one is full width with a remove button, and tapping a
// drawing reopens it for editing (onEditDrawing).
export default function NoteMedia({ note, editable = false, onEditDrawing }) {
  const c = useTheme();
  const removeImage = useNotes((s) => s.removeImage);
  const removeDrawing = useNotes((s) => s.removeDrawing);
  const [width, setWidth] = useState(0);
  const images = note.images || [];
  const drawings = note.drawings || [];

  if (!images.length && !drawings.length) return null;

  const imageBox = (img, w, h) => (
    <View key={img.id} style={{ width: w, height: h, borderRadius: 4, overflow: "hidden" }}>
      <Image source={{ uri: img.uri }} style={{ width: w, height: h }} resizeMode="cover" />
      {editable && <RemoveButton label="Remove image" onPress={() => removeImage(note.id, img.id)} />}
    </View>
  );

  let imageBlock = null;
  if (width && images.length) {
    if (editable) {
      // full width, each image keeps its shape
      imageBlock = images.map((img) => {
        const ratio = Math.min(2, Math.max(0.4, (img.height || 1) / (img.width || 1)));
        return imageBox(img, width, width * ratio);
      });
    } else if (images.length === 1) {
      const img = images[0];
      const ratio = Math.min(1.5, Math.max(0.5, (img.height || 1) / (img.width || 1)));
      imageBlock = imageBox(img, width, width * ratio);
    } else {
      // 2 columns of squares, at most 4 shown
      const cell = (width - GAP) / 2;
      imageBlock = (
        <View style={styles.grid}>
          {images.slice(0, MAX_ON_CARD).map((img) => imageBox(img, cell, cell))}
        </View>
      );
    }
  }

  return (
    <View style={styles.wrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {imageBlock}
      {!!width &&
        drawings.map((d) => (
          <View key={d.id} style={[styles.drawing, { borderColor: c.border }]}>
            <Pressable disabled={!editable} onPress={() => onEditDrawing?.(d)}>
              <DrawingView drawing={d} width={width - 2} />
            </Pressable>
            {editable && (
              <RemoveButton label="Remove drawing" onPress={() => removeDrawing(note.id, d.id)} />
            )}
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: GAP },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  drawing: { borderWidth: 1, borderRadius: 4, overflow: "hidden" },
  remove: { position: "absolute", top: 6, right: 6 },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
});
