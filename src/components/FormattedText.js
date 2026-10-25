import { Text, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { lineStyle, splitBody } from "@/lib/richText";

const MAX_LINES = 12;

// Read-only text of a note with each line's formatting (used on the cards).
export default function FormattedText({ note, size = "card" }) {
  const c = useTheme();
  if (!note.body) return null;
  const { lines, fmts } = splitBody(note);
  return (
    <View>
      {lines.slice(0, MAX_LINES).map((line, i) => (
        <Text key={i} style={lineStyle(fmts[i], c.text, size)} numberOfLines={4}>
          {/* an empty line still takes up space, like a blank line in the note */}
          {line === "" ? " " : line}
        </Text>
      ))}
      {lines.length > MAX_LINES && <Text style={{ color: c.muted, fontSize: 12 }}>...</Text>}
    </View>
  );
}
