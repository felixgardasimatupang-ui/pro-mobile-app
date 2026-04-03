import { WifiOff } from "lucide-react";

type OfflineBannerProps = {
  visible: boolean;
};

const OfflineBanner = ({ visible }: OfflineBannerProps) => {
  if (!visible) return null;

  return (
    <div className="sticky top-0 z-[60] border-b border-warning/30 bg-warning/10 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 px-4 py-2 text-center text-xs font-medium text-foreground">
        <WifiOff className="h-4 w-4 text-warning" />
        <span>Anda sedang offline. Data yang tampil mungkin berasal dari cache terakhir.</span>
      </div>
    </div>
  );
};

export default OfflineBanner;
