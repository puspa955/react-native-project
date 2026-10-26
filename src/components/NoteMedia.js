import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { DrawingView } from "@/components/Drawing";
import Icon from "@/components/Icon";
import Tip from "@/components/Tip";
import { useTheme } from "@/hooks/useTheme";
import { useNotes } from "@/store/notesStore";

const GAP = 4;
const MAX_ON_CARD = 4;
const CARD_DRAWING_MAX_HEIGHT = 200; // a drawing thumbnail on a card is cut off after this height

// The round dark button style used for the little buttons on top of a picture (also by the pin).
export const mediaButtonStyle = {
  width: 26,
  height: 26,
  borderRadius: 13,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(0,0,0,0.6)",
};

// Buttons in the top-right corner of a picture: the note's pin (only on the first picture, passed
// in as `pin`) next to a delete button.
function MediaActions({ pin, label, onDelete }) {
  return (
    <View style={styles.actions}>
      {pin}
      <Tip label={label}>
        <Pressable onPress={onDelete} hitSlop={6} style={mediaButtonStyle} accessibilityLabel={label}>
          <Icon name="delete-outline" size={16} color="#ffffff" />
        </Pressable>
      </Tip>
    </View>
  );
}

// Images + drawings of a note. On a card (`editable` false) images are shown as a compact grid;
// in the editor (`editable` true) each one is full width with a remove button, and tapping a
// drawing reopens it for editing (onEditDrawing). `pin` is an optional pin button, shown in the
// corner of the first picture, so it sits in the same row as that picture's delete button.
export default function NoteMedia({ note, editable = false, onEditDrawing, pin }) {
  const c = useTheme();
  const removeImage = useNotes((s) => s.removeImage);
  const removeDrawing = useNotes((s) => s.removeDrawing);
  const [width, setWidth] = useState(0);
  const images = note.images || [];
  const drawings = note.drawings || [];

  if (!images.length && !drawings.length) return null;

  const imageBox = (img, w, h, index = 1) => (
    <View key={img.id} style={{ width: w, height: h, borderRadius: 4, overflow: "hidden" }}>
      <Image source={{ uri: img.uri }} style={{ width: w, height: h }} resizeMode="cover" />
      {editable && (
        <MediaActions
          label="Delete image"
          pin={index === 0 ? pin : null}
          onDelete={() => removeImage(note.id, img.id)}
        />
      )}
    </View>
  );

  let imageBlock = null;
  if (width && images.length) {
    if (editable) {
      // full width, each image keeps its shape
      imageBlock = images.map((img, i) => {
        const ratio = Math.min(2, Math.max(0.4, (img.height || 1) / (img.width || 1)));
        return imageBox(img, width, width * ratio, i);
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
        drawings.map((d, i) => (
          <View
            key={d.id}
            // on a card, a tall drawing shows only its top part instead of a very tall thumbnail
            style={[
              styles.drawing,
              { borderColor: c.border },
              !editable && { maxHeight: CARD_DRAWING_MAX_HEIGHT },
            ]}
          >
            <Pressable disabled={!editable} onPress={() => onEditDrawing?.(d)}>
              <DrawingView drawing={d} width={width - 2} />
            </Pressable>
            {editable && (
              <MediaActions
                label="Delete drawing"
                // the pin goes on the very first picture: this drawing only if there are no images
                pin={i === 0 && images.length === 0 ? pin : null}
                onDelete={() => removeDrawing(note.id, d.id)}
              />
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
  actions: { position: "absolute", top: 6, right: 6, flexDirection: "row", gap: 6 },
});
