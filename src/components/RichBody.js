import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, TextInput, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { lineStyle, splitBody } from "@/lib/richText";
import { useNotes } from "@/store/notesStore";

const noOutline = Platform.select({ web: { outlineStyle: "none" }, default: {} });

// The text of a note, one text field per line, so every line can have its own look (heading,
// bold, colour, ...). Enter splits a line in two; Backspace at the start of a line joins it to
// the one above. The note's `body` stays plain text (lines joined by "\n") and the looks are
// saved in `lineFormats`, see lib/richText.js.
//   onFocusLine(i): tells the editor which line the formatting bar should change.
export default function RichBody({ note, minHeight = 0, onFocusLine }) {
  const c = useTheme();
  const { lines, fmts } = splitBody(note);
  const inputs = useRef([]); // the text field of each line
  const selections = useRef([]); // each field's cursor position, so we know when it is at the start
  const pending = useRef(null); // where to put the cursor after the lines changed: { index, pos }
  const [forcedSelection, setForcedSelection] = useState(null);
  const [heights, setHeights] = useState({}); // each field's height (wrapped long lines grow)

  const commit = (newLines, newFmts) =>
    useNotes.getState().update(note.id, { body: newLines.join("\n"), lineFormats: newFmts });

  // after the lines changed (Enter / Backspace), move the cursor to where it belongs
  useEffect(() => {
    if (!pending.current) return;
    const { index, pos } = pending.current;
    pending.current = null;
    inputs.current[index]?.focus();
    setForcedSelection({ index, pos });
  });

  const change = (i, text) => {
    if (!text.includes("\n")) {
      const next = [...lines];
      next[i] = text;
      return commit(next, fmts);
    }
    // Enter was pressed: the text after the cursor becomes a new line (headings end there)
    const parts = text.split("\n");
    const inherited = { ...fmts[i] };
    const after = { ...fmts[i], h: 0 };
    pending.current = { index: i + parts.length - 1, pos: 0 };
    commit(
      [...lines.slice(0, i), ...parts, ...lines.slice(i + 1)],
      [...fmts.slice(0, i), inherited, ...parts.slice(1).map(() => ({ ...after })), ...fmts.slice(i + 1)]
    );
  };

  const joinWithPrevious = (i) => {
    pending.current = { index: i - 1, pos: lines[i - 1].length };
    commit(
      [...lines.slice(0, i - 1), lines[i - 1] + lines[i], ...lines.slice(i + 1)],
      [...fmts.slice(0, i), ...fmts.slice(i + 1)]
    );
  };

  const onlyOneEmptyLine = lines.length === 1 && lines[0] === "";

  return (
    <View style={{ minHeight }}>
      {lines.map((line, i) => {
        const style = lineStyle(fmts[i], c.text);
        return (
          <TextInput
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            value={line}
            onChangeText={(t) => change(i, t)}
            onFocus={() => onFocusLine?.(i)}
            onSelectionChange={(e) => {
              selections.current[i] = e.nativeEvent.selection;
              if (forcedSelection) setForcedSelection(null);
            }}
            selection={
              forcedSelection?.index === i
                ? { start: forcedSelection.pos, end: forcedSelection.pos }
                : undefined
            }
            onKeyPress={(e) => {
              if (e.nativeEvent.key !== "Backspace" || i === 0) return;
              // web: ask the text box where its cursor is; phone: use the last selection event
              const box = e.target;
              const sel =
                typeof box?.selectionStart === "number"
                  ? { start: box.selectionStart, end: box.selectionEnd }
                  : selections.current[i];
              if (sel && sel.start === 0 && sel.end === 0) {
                // cancel the key's normal action, or the browser would also delete a letter
                // in the line we are about to move the cursor to
                e.preventDefault?.();
                joinWithPrevious(i);
              }
            }}
            onContentSizeChange={(e) => {
              const h = e.nativeEvent.contentSize.height;
              setHeights((prev) => (prev[i] === h ? prev : { ...prev, [i]: h }));
            }}
            placeholder={onlyOneEmptyLine ? "Take a note..." : undefined}
            placeholderTextColor={c.muted}
            multiline
            scrollEnabled={false}
            blurOnSubmit={false}
            style={[
              styles.line,
              noOutline,
              style,
              { height: Math.max(style.lineHeight, heights[i] || 0) },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  line: { padding: 0, textAlignVertical: "top" },
});
