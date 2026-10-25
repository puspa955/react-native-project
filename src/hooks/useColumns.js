import { useWindowDimensions } from "react-native";
import { SIDEBAR_WIDTH, WIDE_BREAKPOINT } from "@/theme";

// How many masonry columns fit, based on the space next to the sidebar.
export function useColumns() {
  const { width } = useWindowDimensions();
  const available = width >= WIDE_BREAKPOINT ? width - SIDEBAR_WIDTH : width;
  if (available >= 1100) return 5;
  if (available >= 850) return 4;
  if (available >= 560) return 3;
  return 2;
}

export function useIsWide() {
  return useWindowDimensions().width >= WIDE_BREAKPOINT;
}
