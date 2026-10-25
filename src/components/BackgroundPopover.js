import { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { BACKGROUNDS, PICTURE_SIZE, THUMB_REGION } from "@/backgrounds";
import Icon from "@/components/Icon";
import Tip from "@/components/Tip";
import { useTheme } from "@/hooks/useTheme";
import { useNotes } from "@/store/notesStore";
import { NOTE_COLORS, noteBg } from "@/theme";

const DOT = 32;
const GAP = 6;
const PANEL_PAD = 8;

// The picture, zoomed in on its focus spot so a round thumbnail shows what the pattern looks like
// (the whole picture squeezed into 32px would just be a flat colour).
function ThumbImage({ background }) {
  const k = DOT / THUMB_REGION; // picture pixels -> thumbnail pixels
  const [fx, fy] = background.focus;
  return (
    <Image
      source={background.source}
      resizeMode="stretch"
      style={{
        position: "absolute",
        width: PICTURE_SIZE.width * k,
        height: PICTURE_SIZE.height * k,
        left: DOT / 2 - fx * k,
        top: DOT / 2 - fy * k,
      }}
    />
  );
}

// The outline of a round thumbnail, drawn ON TOP of the picture. (As a normal border, a thicker
// "selected" border would shrink the area the picture is drawn in and leave a gap at the edge.)
function Ring({ selected, color, idle }) {
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.ring,
        { borderColor: selected ? color : idle, borderWidth: selected ? 2 : 1 },
      ]}
    />
  );
}

// Google Keep's "Background options" popover: a row of colours, and under it a row of
// background pictures. It opens next to the button that was pressed (anchorRef).
export default function BackgroundPopover({ visible, anchorRef, note, onClose }) {
  const c = useTheme();
  const { width, height } = useWindowDimensions();
  const setColor = useNotes((s) => s.setColor);
  const setBackground = useNotes((s) => s.setBackground);
  const [anchor, setAnchor] = useState(null); // where the button is on screen

  useEffect(() => {
    if (!visible) return;
    anchorRef.current?.measureInWindow((x, y, w, h) => setAnchor({ x, y, w, h }));
  }, [visible, anchorRef]);

  if (!visible) return null;

  // 12 colour dots + the padding and 1px border either side; narrower screens wrap to a second line
  const panelWidth = Math.min(width - 16, 12 * (DOT + GAP) - GAP + 2 * PANEL_PAD + 2);
  const a = anchor || { x: width / 2, y: height / 2, w: 0, h: 0 };
  const left = Math.max(8, Math.min(width - panelWidth - 8, a.x + a.w / 2 - panelWidth / 2));
  // open below the button when it is in the top half of the screen, otherwise above it
  const below = a.y + a.h / 2 < height / 2;
  const vertical = below ? { top: a.y + a.h + 8 } : { bottom: height - a.y + 8 };

  const hasBackground = !!note.background;
  const dotBase = { width: DOT, height: DOT, borderRadius: DOT / 2, borderColor: c.border };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.panel,
            vertical,
            { left, width: panelWidth, backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          {/* colours */}
          <View style={styles.row}>
            {NOTE_COLORS.map((col) => {
              const selected = !hasBackground && note.color === col.key;
              const isDefault = col.key === "default";
              return (
                <Tip key={col.key} label={col.name} placement={below ? "bottom" : "top"}>
                  <Pressable
                    onPress={() => setColor(note.id, col.key)}
                    accessibilityLabel={col.name}
                    style={[
                      styles.dot,
                      dotBase,
                      { backgroundColor: noteBg(col.key, c.dark) },
                      selected && { borderColor: c.primary, borderWidth: 2 },
                    ]}
                  >
                    {isDefault && !selected && <Icon name="format-color-reset" size={18} color={c.muted} />}
                    {selected && <Icon name="check" size={18} color={c.text} />}
                  </Pressable>
                </Tip>
              );
            })}
          </View>

          {/* background pictures */}
          <View style={styles.row}>
            <Tip label="No background" placement={below ? "bottom" : "top"}>
              <Pressable
                onPress={() => setBackground(note.id, null)}
                accessibilityLabel="No background"
                style={[styles.thumb, { backgroundColor: c.surface }]}
              >
                <Icon name="hide-image" size={18} color={!hasBackground ? c.text : c.muted} />
                <Ring selected={!hasBackground} color={c.primary} idle={c.border} />
              </Pressable>
            </Tip>
            {BACKGROUNDS.map((b) => {
              const selected = note.background === b.key;
              return (
                <Tip key={b.key} label={b.name} placement={below ? "bottom" : "top"}>
                  <Pressable
                    onPress={() => setBackground(note.id, b.key)}
                    accessibilityLabel={b.name}
                    style={styles.thumb}
                  >
                    <ThumbImage background={b} />
                    {selected && (
                      <View style={styles.thumbCheck}>
                        <Icon name="check" size={18} color="#ffffff" />
                      </View>
                    )}
                    <Ring selected={selected} color={c.primary} idle={c.border} />
                  </Pressable>
                </Tip>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  panel: {
    position: "absolute",
    padding: PANEL_PAD,
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  dot: { borderWidth: 1, alignItems: "center", justifyContent: "center" },
  // pictures are round like the colours; overflow hidden crops the zoomed picture to the circle
  thumb: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  ring: { borderRadius: DOT / 2 },
  thumbCheck: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
});
