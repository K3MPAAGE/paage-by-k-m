import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Check, Share, MoreVertical, ArrowLeft } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="max-w-sm w-full space-y-6">
        <img src="/pwa-icon-192.png" alt="PAAGE" className="w-24 h-24 rounded-2xl mx-auto shadow-lg" />

        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Install PAAGE <span className="text-primary">by K³M</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Get the full app experience — faster loading, works offline, and feels like a native app.
          </p>
        </div>

        {isInstalled ? (
          <div className="flex items-center justify-center gap-2 text-primary font-semibold">
            <Check className="h-5 w-5" /> App installed!
          </div>
        ) : deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-display font-semibold py-3.5 transition-all hover:brightness-110"
          >
            <Download className="h-5 w-5" /> Install App
          </button>
        ) : isIOS ? (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3 text-left">
            <p className="text-sm font-semibold text-foreground">To install on iPhone/iPad:</p>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Share className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <span>Tap the <strong className="text-foreground">Share</strong> button in Safari</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Download className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <span>Scroll down and tap <strong className="text-foreground">"Add to Home Screen"</strong></span>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3 text-left">
            <p className="text-sm font-semibold text-foreground">To install on Android:</p>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <MoreVertical className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <span>Tap the <strong className="text-foreground">menu (⋮)</strong> in your browser</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Download className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <span>Tap <strong className="text-foreground">"Install app"</strong> or <strong className="text-foreground">"Add to Home Screen"</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Install;
