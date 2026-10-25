import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";
import { newId } from "@/lib/id";

// Picking images needs a native module. Like with notifications, we check it exists first so a
// build without it (e.g. some Expo Go versions) shows a message instead of crashing.
const pickerAvailable = () =>
  Platform.OS === "web" || !!requireOptionalNativeModule("ExponentImagePicker");
const filesAvailable = () => !!requireOptionalNativeModule("FileSystem");

// Web: the picker gives a full-size data URL. Shrink it so many images fit in browser storage.
function shrinkOnWeb(uri, maxSide = 1280) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve({ uri: canvas.toDataURL("image/jpeg", 0.75), width, height });
    };
    img.onerror = () => resolve(null);
    img.src = uri;
  });
}

// Phone: the picker returns a temporary cache file; copy it into the app's permanent folder.
function keepOnPhone(uri) {
  if (!filesAvailable()) return uri;
  try {
    const { File, Paths } = require("expo-file-system");
    const dest = new File(Paths.document, `img-${newId()}.jpg`);
    new File(uri).copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}

// Opens the photo library. Resolves to { images: [{ id, uri, width, height }] } (empty if the
// user cancelled) or { error: "message" } if images can't be picked in this build.
export async function pickImages() {
  if (!pickerAvailable()) {
    return { error: "Adding images isn't available in this version of the app." };
  }
  try {
    const ImagePicker = require("expo-image-picker");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (result.canceled) return { images: [] };

    const images = [];
    for (const asset of result.assets) {
      if (Platform.OS === "web") {
        const small = await shrinkOnWeb(asset.uri);
        if (small) images.push({ id: newId(), ...small });
      } else {
        images.push({
          id: newId(),
          uri: keepOnPhone(asset.uri),
          width: asset.width || 1,
          height: asset.height || 1,
        });
      }
    }
    return { images };
  } catch {
    return { error: "Couldn't open your photos." };
  }
}
