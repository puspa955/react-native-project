import { useColorScheme } from "react-native";
import { useSettings } from "@/store/settingsStore";
import { darkColors, lightColors } from "@/theme";

// Returns the color set for the current mode, plus `dark` and `toggle`.
export function useTheme() {
  const scheme = useColorScheme();
  const mode = useSettings((s) => s.mode);
  const setMode = useSettings((s) => s.setMode);
  const dark = mode === "system" ? scheme === "dark" : mode === "dark";
  return {
    ...(dark ? darkColors : lightColors),
    dark,
    toggle: () => setMode(dark ? "light" : "dark"),
  };
}
