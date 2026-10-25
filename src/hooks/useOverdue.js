import { useEffect, useState } from "react";
import { AppState } from "react-native";

// True once `timestamp` has passed. It re-renders the component at that moment, and again
// when the app comes back to the foreground (timers don't run while the phone app is asleep).
export function useOverdue(timestamp) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!timestamp || now >= timestamp) return; // nothing left to wait for
    const refresh = () => setNow(Date.now());

    // setTimeout can't wait longer than ~24 days; if it fires early `now` changes, this
    // effect re-runs and sets the timer again.
    const wait = Math.min(Math.max(timestamp - Date.now(), 0) + 200, 2 ** 31 - 1);
    const timer = setTimeout(refresh, wait);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [timestamp, now]);

  return !!timestamp && now >= timestamp;
}
