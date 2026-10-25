import { useWindowDimensions } from "react-native";
import { IS_WEB } from "@/lib/platform";
import { useSettings } from "@/store/settingsStore";
import { RAIL_WIDTH, SIDEBAR_WIDTH, WIDE_BREAKPOINT } from "@/theme";

// How many masonry columns fit, based on the space next to the sidebar.
// In list layout it's always a single column.
export function useColumns() {
  const { width } = useWindowDimensions();
  const list = useSettings((s) => s.layout === "list");
  const sidebarOpen = useSettings((s) => s.sidebarOpen);
  if (list) return 1;
  const sidebar = sidebarOpen ? SIDEBAR_WIDTH : RAIL_WIDTH;
  const available = IS_WEB && width >= WIDE_BREAKPOINT ? width - sidebar : width;
  if (available >= 1100) return 5;
  if (available >= 850) return 4;
  if (available >= 560) return 3;
  return 2;
}

// Web with enough room: the sidebar stays on screen. Narrow web windows and the phone apps use
// the slide-in menu (drawer) instead.
export function useHasSidebar() {
  const { width } = useWindowDimensions();
  return IS_WEB && width >= WIDE_BREAKPOINT;
}
