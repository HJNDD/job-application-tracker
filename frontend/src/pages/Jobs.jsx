import { useEffect, useMemo, useState } from "react";
import { apiFetch, clearToken } from "../api";
import { useNavigate } from "react-router-dom";

// 你可以把这些状态改成和后端 Job.status choices 完全一致的值
const STATUS_OPTIONS = [
  "applied",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
];

// 可选：定义几个常用流转按钮（也可以不写，直接手动选 to_status）
const QUICK_TRANSITIONS = [
  { label: "→ interview", to: "interview" },
  { label: "→ offer", to: "offer" },
  { label: "→ rejected", to: "rejected" },
];

export default function Jobs() {
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  // Create 表单
  const [createForm, setCreateForm] = useState({
    company: "",
    title: "",
    status: STATUS_OPTIONS[0],
    note: "",
  });

  // Edit 模式：存正在编辑的 job id；以及编辑表单
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    company: "",
    title: "",
    status: "",
    note: "",
  });

  const editingJob = useMemo(
    () => items.find((x) => x.id === editingId) || null,
    [items, editingId]
  );

  async function load() {
    setMsg("");
    try {
      const res = await apiFetch("/api/jobs/");
      if (!res.ok) {
        setMsg(`加载失败（HTTP ${res.status}）：${JSON.stringify(res.data)}`);
        return;
      }
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setItems(data);
    } catch (e) {
      if (String(e.message) === "UNAUTHORIZED") {
        clearToken();
        nav("/login");
        return;
      }
      setMsg(String(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleLogout() {
    clearToken();
    nav("/login");
  }

  function handleStartEdit(job) {
    setMsg("");
    setEditingId(job.id);
    setEditForm({
      company: job.company ?? "",
      title: job.title ?? "",
      status: job.status ?? STATUS_OPTIONS[0],
      note: job.note ?? "",
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditForm({ company: "", title: "", status: "", note: "" });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setMsg("");

    try {
      const res = await apiFetch("/api/jobs/", {
        method: "POST",
        body: JSON.stringify(createForm),
      });

      if (!res.ok) {
        setMsg(`创建失败（HTTP ${res.status}）：${JSON.stringify(res.data)}`);
        return;
      }

      setCreateForm({ company: "", title: "", status: STATUS_OPTIONS[0], note: "" });
      await load();
    } catch (e2) {
      if (String(e2.message) === "UNAUTHORIZED") return handleLogout();
      setMsg(String(e2));
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editingId) return;

    setMsg("");
    try {
      const res = await apiFetch(`/api/jobs/${editingId}/`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        setMsg(`更新失败（HTTP ${res.status}）：${JSON.stringify(res.data)}`);
        return;
      }

      setEditingId(null);
      await load();
    } catch (e2) {
      if (String(e2.message) === "UNAUTHORIZED") return handleLogout();
      setMsg(String(e2));
    }
  }

  async function handleDelete(jobId) {
    setMsg("");
    const ok = window.confirm("确定要删除这个 job 吗？");
    if (!ok) return;

    try {
      const res = await apiFetch(`/api/jobs/${jobId}/`, {
        method: "DELETE",
      });

      // DRF delete 通常返回 204，无 body，所以 res.data 可能是空
      if (!res.ok) {
        setMsg(`删除失败（HTTP ${res.status}）：${JSON.stringify(res.data)}`);
        return;
      }

      // 如果你正在编辑它，也退出编辑
      if (editingId === jobId) handleCancelEdit();
      await load();
    } catch (e2) {
      if (String(e2.message) === "UNAUTHORIZED") return handleLogout();
      setMsg(String(e2));
    }
  }

  async function handleTransition(jobId, to_status) {
    setMsg("");
    try {
      const res = await apiFetch(`/api/jobs/${jobId}/transition/`, {
        method: "POST",
        body: JSON.stringify({ to_status }),
      });

      if (!res.ok) {
        setMsg(`流转失败（HTTP ${res.status}）：${JSON.stringify(res.data)}`);
        return;
      }

      await load();
    } catch (e2) {
      if (String(e2.message) === "UNAUTHORIZED") return handleLogout();
      setMsg(String(e2));
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Jobs</h2>
        <button onClick={load}>Refresh</button>
        <button onClick={handleLogout}>Logout</button>
      </div>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      {/* Create */}
      <div style={{ marginTop: 18, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Create Job</h3>
        <form onSubmit={handleCreate} style={{ display: "grid", gap: 10 }}>
          <input
            placeholder="Company"
            value={createForm.company}
            onChange={(e) => setCreateForm((s) => ({ ...s, company: e.target.value }))}
            style={{ padding: 8 }}
          />
          <input
            placeholder="Title"
            value={createForm.title}
            onChange={(e) => setCreateForm((s) => ({ ...s, title: e.target.value }))}
            style={{ padding: 8 }}
          />
          <select
            value={createForm.status}
            onChange={(e) => setCreateForm((s) => ({ ...s, status: e.target.value }))}
            style={{ padding: 8 }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Note"
            value={createForm.note}
            onChange={(e) => setCreateForm((s) => ({ ...s, note: e.target.value }))}
            rows={3}
            style={{ padding: 8 }}
          />
          <button style={{ padding: "8px 12px", width: 140 }}>Create</button>
        </form>
      </div>

      {/* List */}
      <div style={{ marginTop: 18 }}>
        <h3>List</h3>

        {!items.length && !msg && <p>暂无数据（或者你还没创建 job）。</p>}

        <ul style={{ marginTop: 12, paddingLeft: 18 }}>
          {items.map((j) => (
            <li key={j.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <b>{j.company}</b>
                <span>— {j.title}</span>
                <span style={{ opacity: 0.75 }}>| status: {j.status}</span>

                <button onClick={() => handleStartEdit(j)}>Edit</button>
                <button onClick={() => handleDelete(j.id)}>Delete</button>

                {/* quick transition buttons */}
                {QUICK_TRANSITIONS.map((t) => (
                  <button key={t.to} onClick={() => handleTransition(j.id, t.to)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Edit panel under item */}
              {editingId === j.id && (
                <div style={{ marginTop: 10, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
                  <h4 style={{ marginTop: 0 }}>Edit #{j.id}</h4>
                  <form onSubmit={handleUpdate} style={{ display: "grid", gap: 10 }}>
                    <input
                      placeholder="Company"
                      value={editForm.company}
                      onChange={(e) => setEditForm((s) => ({ ...s, company: e.target.value }))}
                      style={{ padding: 8 }}
                    />
                    <input
                      placeholder="Title"
                      value={editForm.title}
                      onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))}
                      style={{ padding: 8 }}
                    />
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm((s) => ({ ...s, status: e.target.value }))}
                      style={{ padding: 8 }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <textarea
                      placeholder="Note"
                      value={editForm.note}
                      onChange={(e) => setEditForm((s) => ({ ...s, note: e.target.value }))}
                      rows={3}
                      style={{ padding: 8 }}
                    />
                    <div style={{ display: "flex", gap: 10 }}>
                      <button style={{ padding: "8px 12px", width: 140 }}>Save</button>
                      <button type="button" onClick={handleCancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </form>

                  {/* 手动 transition 下拉（如果你不想用 quick buttons） */}
                  <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ opacity: 0.75 }}>Transition:</span>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const to = e.target.value;
                        if (to) handleTransition(j.id, to);
                        e.target.value = "";
                      }}
                      style={{ padding: 6 }}
                    >
                      <option value="">Select to_status...</option>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <span style={{ opacity: 0.65 }}>
                      （如果后端不允许流转，会返回 400，msg 会显示原因）
                    </span>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
