import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTheme } from "@/hooks/useTheme";

// One place for icons. Names are Material Icons names ("search", "archive", ...), except
// the pin, which only has a good outline version in MaterialCommunityIcons.
export default function Icon({ name, size = 22, color, style }) {
  const c = useTheme();
  const Family = name.startsWith("pin") ? MaterialCommunityIcons : MaterialIcons;
  return <Family name={name} size={size} color={color ?? c.muted} style={style} />;
}
