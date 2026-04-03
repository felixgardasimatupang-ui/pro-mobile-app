const normalizeUrl = (value?: string) => {
  if (!value) return null;
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

export const getAppUrl = () => {
  const envUrl = normalizeUrl(import.meta.env.VITE_APP_URL);
  if (envUrl) return envUrl;

  if (typeof window !== "undefined") {
    return normalizeUrl(window.location.origin) ?? "http://localhost:8080";
  }

  return "http://localhost:8080";
};
