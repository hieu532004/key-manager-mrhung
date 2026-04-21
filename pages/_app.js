import "../styles/globals.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const PUBLIC_PATHS = ["/login", "/_error"];

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async (url) => {
      const path = String(url || "").split("?")[0];

      if (PUBLIC_PATHS.includes(path)) {
        if (!cancelled) {
          setAuthorized(true);
          setCheckingAuth(false);
        }
        return;
      }

      if (!cancelled) {
        setCheckingAuth(true);
      }

      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!cancelled && res.ok) {
          setAuthorized(true);
          setCheckingAuth(false);
          return;
        }
      } catch (_) {
        // Redirect below handles unreachable auth server too.
      }

      if (!cancelled) {
        setAuthorized(false);
        setCheckingAuth(false);
        router.replace("/login");
      }
    };

    checkAuth(router.pathname);
    router.events.on("routeChangeComplete", checkAuth);
    return () => {
      cancelled = true;
      router.events.off("routeChangeComplete", checkAuth);
    };
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <div className="text-sm text-slate-400">Dang kiem tra dang nhap...</div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <Component {...pageProps} />;
}
