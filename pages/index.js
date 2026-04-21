import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

const emptyForm = {
  licenseKey: "",
  machineId: "",
  expiration: "",
  ownerName: "",
  ownerPhone: "",
  status: "Active",
};

const PAGE_SIZE = 20;

function dateInputValue(dt) {
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayIso() {
  return dateInputValue(new Date());
}

function plusDays(days) {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  return dateInputValue(dt);
}

function defaultExpirationForRole(role) {
  return plusDays(role === "support" ? 10 : 30);
}

function statusClass(item) {
  if (item.expired || item.status === "Expired") {
    return "border-red-500/35 bg-red-500/10 text-red-200";
  }
  if (item.active) {
    return "border-emerald-500/35 bg-emerald-500/10 text-emerald-200";
  }
  return "border-slate-500/30 bg-slate-500/10 text-slate-300";
}

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ ...emptyForm, expiration: plusDays(30) });
  const [editingKey, setEditingKey] = useState("");
  const [importText, setImportText] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isSupport = session?.role === "support";
  const supportMaxExpiration = plusDays(10);

  const stats = useMemo(() => {
    const active = items.filter((item) => item.active).length;
    const expired = items.filter((item) => item.expired || item.status === "Expired").length;
    return {
      total: items.length,
      active,
      expired,
      inactive: items.length - active - expired,
    };
  }, [items]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(items.length / PAGE_SIZE)), [items.length]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  const visiblePages = useMemo(() => {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let current = start; current <= end; current += 1) {
      pages.push(current);
    }
    return pages;
  }, [page, totalPages]);

  const rangeStart = items.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = items.length ? Math.min(items.length, page * PAGE_SIZE) : 0;

  const checkSession = async () => {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) {
      router.replace("/login");
      return false;
    }
    const data = await res.json();
    setSession({
      username: String(data.username || ""),
      role: String(data.role || "admin").toLowerCase(),
    });
    return true;
  };

  const loadItems = async (rawQuery = query) => {
    setLoading(true);
    setError("");
    try {
      const normalizedQuery = String(rawQuery || "").trim();
      const suffix = normalizedQuery ? `?q=${encodeURIComponent(normalizedQuery)}` : "";
      const res = await fetch(`/api/keys${suffix}`, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Khong tai duoc license");
      setItems(Array.isArray(data.items) ? data.items : []);
      setPage(1);
    } catch (err) {
      setError(err.message || "Khong tai duoc du lieu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      setError("");
      try {
        const ok = await checkSession();
        if (!ok || cancelled) return;
        await loadItems("");
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Khong tai duoc du lieu");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (session?.role === "support" && !editingKey) {
      setForm((prev) => ({
        ...prev,
        expiration: plusDays(10),
        status: "Active",
      }));
    }
  }, [session?.role, editingKey]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingKey("");
    setForm({ ...emptyForm, expiration: defaultExpirationForRole(session?.role) });
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      setLoading(true);
      const method = editingKey ? "PUT" : "POST";
      const payload = {
        ...form,
        licenseKey: form.licenseKey.trim(),
      };
      const res = await fetch("/api/keys", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Khong luu duoc license");
      setNotice(editingKey ? "Da cap nhat license" : "Da tao license moi");
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err.message || "Loi luu license");
    } finally {
      setLoading(false);
    }
  };

  const editItem = (item) => {
    setEditingKey(item.licenseKey);
    setForm({
      licenseKey: item.licenseKey || "",
      machineId: item.machineId || "",
      expiration: item.expiration || "",
      ownerName: item.ownerName || "",
      ownerPhone: item.ownerPhone || "",
      status: item.expired ? "Expired" : item.status || "Active",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Xoa license ${item.licenseKey}?`)) return;
    setError("");
    setNotice("");
    try {
      setLoading(true);
      const res = await fetch(`/api/keys?licenseKey=${encodeURIComponent(item.licenseKey)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Khong xoa duoc license");
      setNotice("Da xoa license");
      await loadItems();
    } catch (err) {
      setError(err.message || "Loi xoa license");
    } finally {
      setLoading(false);
    }
  };

  const importRows = async () => {
    setError("");
    setNotice("");
    if (!importText.trim()) {
      setError("Dan bang cu vao o import truoc.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import", text: importText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import loi");
      setNotice(`Da import ${data.imported || 0} license, loi ${data.failed || 0}.`);
      setImportText("");
      await loadItems();
    } catch (err) {
      setError(err.message || "Import loi");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6">
        <header className="flex flex-col gap-4 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-black/20 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Veo3 Grok License Server
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight md:text-4xl">
              Quan ly license & run permit
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Key het han tu dong chuyen do va tat active. Key con han hien xanh
              va duoc server cap session ngan han cho tool.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadItems(query)}
              disabled={loading}
              className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-100 hover:bg-slate-700 disabled:opacity-60"
            >
              Reload
            </button>
            <button
              onClick={logout}
              className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-400"
            >
              Dang xuat
            </button>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="min-h-[88px] rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Tong license</p>
            <p className="mt-1 text-3xl font-black">{stats.total}</p>
          </div>
          <div className="min-h-[88px] rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-xs text-emerald-200">Dang active</p>
            <p className="mt-1 text-3xl font-black text-emerald-100">{stats.active}</p>
          </div>
          <div className="min-h-[88px] rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-xs text-red-200">Het han</p>
            <p className="mt-1 text-3xl font-black text-red-100">{stats.expired}</p>
          </div>
          <div className="min-h-[88px] rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Tam khoa</p>
            <p className="mt-1 text-3xl font-black">{stats.inactive}</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
          <div className="space-y-6">
            <form
              onSubmit={submitForm}
              className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">
                    {editingKey
                      ? "Cap nhat license"
                      : isSupport
                        ? "Tao key dung thu"
                        : "Tao license"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isSupport
                      ? "Tai khoan support chi kich key dung thu toi da 10 ngay."
                      : "Bo trong license key de server tu sinh key moi."}
                  </p>
                </div>
                {editingKey && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                  >
                    Huy
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-bold text-slate-300">License Key</span>
                  <input
                    name="licenseKey"
                    value={form.licenseKey}
                    onChange={updateForm}
                    placeholder="Tu sinh neu bo trong"
                    className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-300">Machine ID</span>
                  <input
                    name="machineId"
                    value={form.machineId}
                    onChange={updateForm}
                    placeholder="Co the bo trong de bind lan dau"
                    className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono outline-none focus:border-cyan-400"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-300">Expiration</span>
                    <input
                      type="date"
                      name="expiration"
                      min={todayIso()}
                      max={isSupport ? supportMaxExpiration : undefined}
                      value={form.expiration}
                      onChange={updateForm}
                      className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-300">Status</span>
                    <select
                      name="status"
                      value={form.status}
                      onChange={updateForm}
                      disabled={isSupport}
                      className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                    >
                      <option>Active</option>
                      <option>Inactive</option>
                      <option>Expired</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="text-xs font-bold text-slate-300">Owner Name</span>
                  <input
                    name="ownerName"
                    value={form.ownerName}
                    onChange={updateForm}
                    className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-300">Owner Phone</span>
                  <input
                    name="ownerPhone"
                    value={form.ownerPhone}
                    onChange={updateForm}
                    className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-5 w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
              >
                {editingKey
                  ? "Luu license"
                  : isSupport
                    ? "Tao key dung thu"
                    : "Tao license tu dong"}
              </button>
            </form>

            {isSupport ? (
              <div className="rounded-3xl border border-cyan-500/30 bg-cyan-500/10 p-5 text-sm text-cyan-100">
                Tai khoan support chi duoc tao key dung thu Active va ngay het
                han khong vuot qua 10 ngay. Quyen import, xoa va kich key dai
                han duoc khoa o server.
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <h2 className="text-lg font-black">Import data cu</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Dan bang du lieu cu theo cot: License Key, Machine ID,
                  Expiration, Owner Name, Owner Phone, Status.
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={7}
                  className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono outline-none focus:border-cyan-400"
                  placeholder={"License Key\tMachine ID\tExpiration\tOwner Name\tOwner Phone\tStatus"}
                />
                <button
                  type="button"
                  onClick={importRows}
                  disabled={loading}
                  className="mt-3 w-full rounded-2xl border border-amber-400/40 bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60"
                >
                  Import / dong bo
                </button>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black">Danh sach license</h2>
                <p className="text-xs text-slate-400">
                  Het han se tu do va active = off khi server reload/check.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Hien {rangeStart}-{rangeEnd} / {items.length} license
                </p>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  loadItems(query);
                }}
                className="flex gap-2 lg:min-w-[360px]"
              >
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tim ten, SDT, machine..."
                  className="w-full min-w-0 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                />
                <button className="rounded-2xl bg-slate-700 px-4 py-2 text-sm font-bold hover:bg-slate-600">
                  Tim
                </button>
              </form>
            </div>

            {(error || notice) && (
              <div className="mb-4 space-y-2">
                {error && (
                  <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {error}
                  </div>
                )}
                {notice && (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    {notice}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 md:hidden">
              {!items.length && (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-500">
                  {loading ? "Dang tai..." : "Chua co license nao."}
                </div>
              )}
              {pagedItems.map((item) => (
                <div
                  key={item.keyHash || item.licenseKey}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[11px] font-bold text-cyan-100">
                        {item.licenseKey}
                      </p>
                      <p className="mt-1 truncate font-mono text-[11px] text-slate-400">
                        {item.machineId || "Chua bind"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-black ${statusClass(item)}`}
                    >
                      {item.active ? "Active" : item.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div className="rounded-xl bg-slate-900/70 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Het han</p>
                      <p className="mt-1 font-semibold text-slate-100">
                        {item.expiration || "No limit"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-900/70 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Owner</p>
                      <p className="mt-1 truncate font-semibold text-slate-100">
                        {item.ownerName || "-"}
                      </p>
                    </div>
                    <div className="col-span-2 rounded-xl bg-slate-900/70 px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Phone</p>
                      <p className="mt-1 truncate font-semibold text-slate-100">
                        {item.ownerPhone || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(item.licenseKey)}
                      className="rounded-xl border border-slate-700 px-3 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-800"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => editItem(item)}
                      className="rounded-xl bg-cyan-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-cyan-400"
                    >
                      Sua
                    </button>
                    {!isSupport && (
                      <button
                        type="button"
                        onClick={() => deleteItem(item)}
                        className="rounded-xl bg-red-500 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-red-400"
                      >
                        Xoa
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-auto rounded-2xl border border-slate-800 md:block">
              <table className="w-full min-w-[980px] table-fixed text-left text-xs">
                <colgroup>
                  <col className="w-[130px]" />
                  <col className="w-[220px]" />
                  <col className="w-[100px]" />
                  <col className="w-[170px]" />
                  <col className="w-[130px]" />
                  <col className="w-[100px]" />
                  <col className="w-[150px]" />
                </colgroup>
                <thead className="bg-slate-950 text-[11px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-2.5">License Key</th>
                    <th className="px-3 py-2.5">Machine ID</th>
                    <th className="px-3 py-2.5">Expiration</th>
                    <th className="px-3 py-2.5">Owner</th>
                    <th className="px-3 py-2.5">Phone</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {!items.length && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                        {loading ? "Dang tai..." : "Chua co license nao."}
                      </td>
                    </tr>
                  )}
                  {pagedItems.map((item) => (
                    <tr key={item.keyHash || item.licenseKey} className="align-top">
                      <td className="px-3 py-2.5 font-mono text-[11px] text-cyan-100">
                        <span className="block truncate" title={item.licenseKey}>
                          {item.licenseKey}
                        </span>
                      </td>
                      <td className="max-w-[220px] px-3 py-2.5 font-mono text-[11px] text-slate-300">
                        <span className="block truncate" title={item.machineId}>
                          {item.machineId || "Chua bind"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass(item)}`}
                        >
                          {item.expiration || "No limit"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-slate-200">
                        <span className="block truncate" title={item.ownerName || ""}>
                          {item.ownerName}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-slate-300">
                        <span className="block truncate" title={item.ownerPhone || ""}>
                          {item.ownerPhone}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-black ${statusClass(item)}`}
                        >
                          {item.active ? "Active" : item.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(item.licenseKey)}
                            className="rounded-xl border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-800"
                          >
                            Copy
                          </button>
                          <button
                            type="button"
                            onClick={() => editItem(item)}
                            className="rounded-xl bg-cyan-500 px-2.5 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-cyan-400"
                          >
                            Sua
                          </button>
                          {!isSupport && (
                            <button
                              type="button"
                              onClick={() => deleteItem(item)}
                              className="rounded-xl bg-red-500 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-red-400"
                            >
                              Xoa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {items.length > PAGE_SIZE && (
              <div className="mt-4 flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-slate-400">
                  Trang {page}/{totalPages} - Hien {rangeStart}-{rangeEnd} / {items.length}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="rounded-xl border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Truoc
                  </button>
                  {visiblePages[0] > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPage(1)}
                        className="rounded-xl border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-800"
                      >
                        1
                      </button>
                      {visiblePages[0] > 2 && <span className="px-1 text-slate-500">...</span>}
                    </>
                  )}
                  {visiblePages.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={
                        pageNumber === page
                          ? "rounded-xl bg-cyan-400 px-2.5 py-1.5 text-[11px] font-bold text-slate-950"
                          : "rounded-xl border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-800"
                      }
                    >
                      {pageNumber}
                    </button>
                  ))}
                  {visiblePages[visiblePages.length - 1] < totalPages && (
                    <>
                      {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                        <span className="px-1 text-slate-500">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setPage(totalPages)}
                        className="rounded-xl border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-800"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                    className="rounded-xl border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
