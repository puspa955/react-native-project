import { Platform } from "react-native";

// The web app and the phone apps have different designs, like Google Keep's web app and its
// Android/iOS apps. Platform decides the design; screen width only decides how much room there is.
//   web:   "Take a note..." bar, notes open in a dialog, no + button
//   phone: + button and bottom bar, notes open full screen
export const IS_WEB = Platform.OS === "web";
