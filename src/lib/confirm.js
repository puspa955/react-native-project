import { Alert, Platform } from "react-native";

// Alert.alert with buttons does nothing on web, so use window.confirm there.
export function confirmDelete(title, message, onYes) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onYes();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: onYes },
  ]);
}
