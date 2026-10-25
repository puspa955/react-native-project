import { useLocalSearchParams, useRouter } from "expo-router";
import NoteEditor from "@/components/NoteEditor";

// Full-screen editor (phones, or opening /note/<id> directly on web).
export default function NoteScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // On web the editor can be opened directly by URL, so there may be no history to go back to.
  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return <NoteEditor noteId={id} onClose={goBack} />;
}
