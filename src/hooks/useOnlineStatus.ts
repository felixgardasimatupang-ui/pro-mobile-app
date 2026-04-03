import { useEffect, useState } from "react";

const getOnlineState = () =>
  typeof navigator === "undefined" ? true : navigator.onLine;

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(getOnlineState);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
};
