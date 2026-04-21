import { useEffect, useState } from "react";
import { useRouter } from "next/router";

async function readJsonSafe(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_) {
    return { error: text };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!cancelled && res.ok) {
          router.replace("/");
          return;
        }
      } catch (_) {
        if (!cancelled) {
          setError(
            "Khong ket noi duoc license server. Hay kiem tra server local hoac deploy Vercel."
          );
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    };

    checkSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });
      const data = await readJsonSafe(res);
      if (!res.ok) throw new Error(data.error || "Dang nhap that bai");
      router.replace("/");
    } catch (err) {
      const message = String(err?.message || "");
      if (message.includes("Failed to fetch")) {
        setError("Khong the ket noi toi license server. Hay bat server truoc khi dang nhap.");
      } else {
        setError(message || "Dang nhap that bai");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl shadow-black/30">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
          Veo3 Grok
        </p>
        <h1 className="mt-2 text-center text-3xl font-black">License Admin</h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Dang nhap bang tai khoan admin hoac support server-side. Cookie duoc luu httpOnly.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-slate-300">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-300">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
            />
          </label>

          {error && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || checking}
            className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
          >
            {checking ? "Dang ket noi server..." : loading ? "Dang kiem tra..." : "Dang nhap"}
          </button>
        </form>
      </section>
    </main>
  );
}
