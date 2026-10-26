import { Image, StyleSheet, View } from "react-native";
import { backgroundSource } from "@/backgrounds";
import { useTheme } from "@/hooks/useTheme";

// The picture behind a note (put it as the first child of a note's card, which should clip it).
// In dark mode the picture is darkened so the light text stays readable.
export default function NoteBackground({ background }) {
  const c = useTheme();
  const source = backgroundSource(background);
  if (!source) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* explicit 100% x 100%: without a size, react-native-web draws the picture at its own
          pixel size (480x320) and leaves the rest of a bigger card uncovered */}
      <Image source={source} style={styles.picture} resizeMode="cover" />
      {c.dark && <View style={[StyleSheet.absoluteFill, styles.dim]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  picture: { width: "100%", height: "100%" },
  dim: { backgroundColor: "rgba(32,33,36,0.62)" },
});
