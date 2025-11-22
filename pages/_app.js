import "../styles/globals.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const PUBLIC_PATHS = ["/login", "/_error"];

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = (url) => {
      const path = url.split("?")[0];

      // Trang public (login) thì không check
      if (PUBLIC_PATHS.includes(path)) {
        setAuthorized(true);
        return;
      }

      if (typeof window === "undefined") {
        setAuthorized(false);
        return;
      }

      const logged = window.localStorage.getItem("mmx_logged_in") === "1";

      if (!logged) {
        setAuthorized(false);
        router.replace("/login");
      } else {
        setAuthorized(true);
      }
    };

    // Check lần đầu khi load
    checkAuth(router.pathname);

    // Check mỗi lần đổi route
    router.events.on("routeChangeComplete", checkAuth);
    return () => {
      router.events.off("routeChangeComplete", checkAuth);
    };
  }, [router]);

  if (!authorized) {
    // Có thể hiển thị màn hình loading nhỏ
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
        <div className="text-sm text-slate-400">Đang kiểm tra đăng nhập...</div>
      </div>
    );
  }

  return <Component {...pageProps} />;
}
