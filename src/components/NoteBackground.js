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
      <Image source={source} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {c.dark && <View style={[StyleSheet.absoluteFill, styles.dim]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { backgroundColor: "rgba(32,33,36,0.62)" },
});
