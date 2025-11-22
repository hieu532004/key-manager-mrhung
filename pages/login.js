import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ACCOUNTS } from "../lib/accounts";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Nếu đã đăng nhập rồi thì tự chuyển về trang chủ
  useEffect(() => {
    if (typeof window === "undefined") return;
    const logged = window.localStorage.getItem("mmx_logged_in") === "1";
    if (logged) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const found = ACCOUNTS.find(
      (acc) =>
        acc.username.trim().toLowerCase() === username.trim().toLowerCase() &&
        acc.password === password
    );

    if (!found) {
      setError("Sai tài khoản hoặc mật khẩu");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("mmx_logged_in", "1");
      window.localStorage.setItem("mmx_username", found.username);
    }

    router.replace("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <h1 className="text-xl font-semibold mb-1 text-center">
          Đăng nhập quản lý KEY
        </h1>
        <p className="text-xs text-slate-400 mb-4 text-center">
          Vui lòng nhập tài khoản nội bộ để truy cập trang quản lý KEY.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1 text-slate-300">
              Tên đăng nhập
            </label>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-slate-300">
              Mật khẩu
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/60 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-emerald-400 text-slate-950 text-sm font-semibold py-2.5 hover:bg-emerald-300 active:scale-[0.99] transition"
          >
            Đăng nhập
          </button>
        </form>

        <div className="mt-4 text-[11px] text-slate-500 space-y-1">
          <p>Gợi ý (test nhanh):</p>
          <p>
            <code className="px-2 py-1 rounded bg-slate-800 border border-slate-700">
              user: admin &nbsp;|&nbsp; pass: 123456
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
