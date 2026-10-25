import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

const DELAY_MS = 450;

// Hover tooltip like Google Keep's. Wrap an icon button: <Tip label="Archive"><Pressable/></Tip>.
// Only on web: phones have no hover, so there it renders the child untouched.
// placement: "bottom" (default) or "top". style: positions the wrapper (e.g. absolute badges).
//
// Hover uses plain DOM mouse events on a View. A Pressable's onHoverIn would NOT work here:
// react-native-web ends an outer Pressable's hover as soon as an inner Pressable is hovered,
// and the button inside a Tip is always an inner Pressable.
export default function Tip({ label, children, placement = "bottom", style }) {
  const [show, setShow] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  if (Platform.OS !== "web" || !label) {
    return style ? <View style={style}>{children}</View> : children;
  }

  const hoverIn = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(true), DELAY_MS);
  };
  const hoverOut = () => {
    clearTimeout(timer.current);
    setShow(false);
  };

  return (
    <View
      onMouseEnter={hoverIn}
      onMouseLeave={hoverOut}
      onMouseDown={hoverOut} // clicking the button hides the tip
      style={[styles.wrap, style]}
    >
      {children}
      {show && (
        <View
          pointerEvents="none"
          style={[styles.tipBox, placement === "top" ? styles.top : styles.bottom]}
        >
          <Text style={styles.tip} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  // wide box centered on the icon, so the label centers whatever its length
  tipBox: { position: "absolute", left: -80, right: -80, alignItems: "center", zIndex: 1000 },
  bottom: { top: "100%", marginTop: 6 },
  top: { bottom: "100%", marginBottom: 6 },
  tip: {
    backgroundColor: "#3c4043",
    color: "#ffffff",
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
});
