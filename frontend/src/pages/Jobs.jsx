import { useEffect, useState } from "react";
import { apiFetch, clearToken } from "../api";
import { useNavigate } from "react-router-dom";

/* ========= 你的后端 status choices 是什么，这里就写什么 ========= */
const STATUS_OPTIONS = ["applied", "interview", "offer", "rejected", "withdrawn"];

/* ✅ 用于按钮/展示的人类可读文案（更像产品） */
const STATUS_LABEL = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Reject",
};

/* ========= 小组件：状态徽章 ========= */
function StatusBadge({ status }) {
  const color =
    status === "offer"
      ? "#16a34a"
      : status === "interview"
      ? "#2563eb"
      : status === "rejected"
      ? "#dc2626"
      : "#6b7280";

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        color: "#fff",
        background: color,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

/* ========= Edit 弹层（✅ 不允许改 status：status 必须走 transition） ========= */
function EditJobModal({ job, onClose, onSaved, onUnauthorized }) {
  const [form, setForm] = useState({
    company: job.company || "",
    title: job.title || "",
    note: job.note || "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!form.company.trim() || !form.title.trim()) {
      setMsg("Company 和 Title 不能为空");
      return;
    }

    setSaving(true);
    try {
      // ✅ 不提交 status，状态只能通过 transition 改
      const payload = {
        company: form.company,
        title: form.title,
        note: form.note,
      };

      const res = await apiFetch(`/api/jobs/${job.id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setMsg(`保存失败（HTTP ${res.status}）：${JSON.stringify(res.data)}`);
        return;
      }

      onSaved(res.data);
    } catch (e) {
      if (String(e.message) === "UNAUTHORIZED") return onUnauthorized();
      setMsg(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.modalOverlay} onMouseDown={onClose}>
      <div style={styles.modalCard} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Edit Job</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
              ID: {job.id}
            </div>
          </div>
          <button onClick={onClose}>Close</button>
        </div>

        {msg && <div style={styles.msg}>{msg}</div>}

        <form onSubmit={onSubmit} style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Company</label>
            <input
              value={form.company}
              onChange={(e) => setForm((s) => ({ ...s, company: e.target.value }))}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              style={styles.input}
            />
          </div>

          <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
            <label style={styles.label}>Note</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
              rows={4}
              style={styles.textarea}
            />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
            <button disabled={saving} style={styles.primaryBtn}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() =>
                setForm({
                  company: job.company || "",
                  title: job.title || "",
                  note: job.note || "",
                })
              }
            >
              Reset
            </button>
          </div>
        </form>

        <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
          小提示：Edit 只改内容，<b>Status 必须走 transition</b>。
        </div>
      </div>
    </div>
  );
}

export default function Jobs() {
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Create 表单（创建时允许选 status：初始状态）
  const [createForm, setCreateForm] = useState({
    company: "",
    title: "",
    status: STATUS_OPTIONS[0],
    note: "",
  });
  const [creating, setCreating] = useState(false);

  // ✅ Edit
  const [editing, setEditing] = useState(null);

  function handleLogout() {
    clearToken();
    nav("/login");
  }

  /* ========= 加载 Jobs ========= */
  async function load() {
    setMsg("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/jobs/");
      if (!res.ok) {
        setMsg(`加载失败（HTTP ${res.status}）：${JSON.stringify(res.data)}`);
        return;
      }

      // 兼容 DRF 是否分页
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setItems(data);
    } catch (e) {
      if (String(e.message) === "UNAUTHORIZED") return handleLogout();
      setMsg(String(e));
    } finally {
      setLoading(false);
    }
  }

  /* ========= Create ========= */
  async function handleCreate(e) {
    e.preventDefault();
    setMsg("");

    if (!createForm.company.trim() || !createForm.title.trim()) {
      setMsg("Company 和 Title 不能为空");
      return;
    }

    setCreating(true);
    try {
      const res = await apiFetch("/api/jobs/", {
        method: "POST",
        body: JSON.stringify(createForm),
      });

      if (!res.ok) {
        setMsg(`创建失败（HTTP ${res.status}）：${JSON.stringify(res.data)}`);
        return;
      }

      setItems((prev) => [res.data, ...prev]);

      setCreateForm({
        company: "",
        title: "",
        status: STATUS_OPTIONS[0],
        note: "",
      });
    } catch (e) {
      if (String(e.message) === "UNAUTHORIZED") return handleLogout();
      setMsg(String(e));
    } finally {
      setCreating(false);
    }
  }

  /* ========= 删除 ========= */
  async function handleDelete(id) {
    if (!window.confirm("确定要删除这条 Job 吗？")) return;

    setMsg("");
    try {
      const res = await apiFetch(`/api/jobs/${id}/`, { method: "DELETE" });

      if (!res.ok) {
        setMsg(`删除失败（HTTP ${res.status}）：${JSON.stringify(res.data)}`);
        return;
      }

      setItems((prev) => prev.filter((j) => j.id !== id));
    } catch (e) {
      if (String(e.message) === "UNAUTHORIZED") return handleLogout();
      setMsg(String(e));
    }
  }

  /* ========= 状态流转（✅ 只通过这个改状态） ========= */
  async function handleTransition(id, toStatus) {
    setMsg("");
    try {
      const res = await apiFetch(`/api/jobs/${id}/transition/`, {
        method: "POST",
        body: JSON.stringify({ to_status: toStatus }),
      });

      if (!res.ok) {
        setMsg(`状态流转失败（HTTP ${res.status}）：${JSON.stringify(res.data)}`);
        return;
      }

      setItems((prev) => prev.map((j) => (j.id === id ? res.data : j)));
    } catch (e) {
      if (String(e.message) === "UNAUTHORIZED") return handleLogout();
      setMsg(String(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={styles.page}>
      {/* ===== Header ===== */}
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>Jobs</h2>
          <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
            Track your applications with status transitions.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load}>Refresh</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {msg && <div style={styles.msg}>{msg}</div>}
      {loading && <p style={{ opacity: 0.7 }}>Loading...</p>}

      {/* ===== Create ===== */}
      <div style={styles.createCard}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Create Job</h3>

        <form onSubmit={handleCreate} style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Company</label>
            <input
              value={createForm.company}
              onChange={(e) =>
                setCreateForm((s) => ({ ...s, company: e.target.value }))
              }
              placeholder="e.g. Atlassian"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Title</label>
            <input
              value={createForm.title}
              onChange={(e) => setCreateForm((s) => ({ ...s, title: e.target.value }))}
              placeholder="e.g. Backend Engineer"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Status</label>
            <select
              value={createForm.status}
              onChange={(e) => setCreateForm((s) => ({ ...s, status: e.target.value }))}
              style={styles.input}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div style={{ ...styles.field, gridColumn: "1 / -1" }}>
            <label style={styles.label}>Note</label>
            <textarea
              value={createForm.note}
              onChange={(e) => setCreateForm((s) => ({ ...s, note: e.target.value }))}
              placeholder="Optional notes..."
              rows={3}
              style={styles.textarea}
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <button disabled={creating} style={styles.primaryBtn}>
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>

      {/* ===== List ===== */}
      <div style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 10 }}>Your Jobs</h3>

        <div style={styles.list}>
          {items.map((j) => (
            <div key={j.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.company}>{j.company}</div>
                  <div style={styles.title}>{j.title}</div>
                </div>
                <StatusBadge status={j.status} />
              </div>

              {j.note ? (
                <div style={styles.note}>{j.note}</div>
              ) : (
                <div style={{ ...styles.note, opacity: 0.5 }}>No note</div>
              )}

              <div style={styles.actions}>
                <button onClick={() => setEditing(j)} style={styles.editBtn}>
                  Edit
                </button>

                {/* ✅ 只显示后端允许的流转按钮 */}
                {(j.can_transition_to || []).map((to) => (
                  <button key={to} onClick={() => handleTransition(j.id, to)}>
                    {STATUS_LABEL[to] || to}
                  </button>
                ))}

                <button onClick={() => handleDelete(j.id)} style={styles.dangerBtn}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {!items.length && !msg && !loading && (
          <p style={{ marginTop: 16, opacity: 0.7 }}>暂无数据，先创建一条 Job 吧。</p>
        )}
      </div>

      {/* ===== Edit Modal ===== */}
      {editing && (
        <EditJobModal
          job={editing}
          onClose={() => setEditing(null)}
          onUnauthorized={handleLogout}
          onSaved={(updated) => {
            setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

/* ========= 样式 ========= */
const styles = {
  page: {
    padding: 24,
    maxWidth: 960,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 18,
  },
  msg: {
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    color: "#9a3412",
    padding: "10px 12px",
    borderRadius: 10,
    marginBottom: 14,
    fontSize: 14,
  },

  createCard: {
    padding: 16,
    borderRadius: 12,
    background: "#fff",
    border: "1px solid #eee",
    boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 180px",
    gap: 12,
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, color: "#666" },
  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #ddd",
    fontSize: 14,
    outline: "none",
  },
  textarea: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #ddd",
    fontSize: 14,
    outline: "none",
    resize: "vertical",
  },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontSize: 14,
    cursor: "pointer",
  },

  list: { marginTop: 12, display: "grid", gap: 14 },
  card: {
    padding: 16,
    borderRadius: 12,
    background: "#fff",
    border: "1px solid #eee",
    boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  company: { fontWeight: 700, fontSize: 16 },
  title: { fontSize: 14, color: "#555", marginTop: 2 },
  note: {
    marginTop: 10,
    fontSize: 13,
    color: "#444",
    background: "#f9fafb",
    border: "1px solid #eee",
    borderRadius: 10,
    padding: 10,
  },
  actions: {
    marginTop: 12,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  editBtn: {
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    color: "#3730a3",
  },
  dangerBtn: {
    background: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#991b1b",
  },

  // modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 999,
  },
  modalCard: {
    width: "min(760px, 100%)",
    borderRadius: 14,
    background: "#fff",
    border: "1px solid #eee",
    boxShadow: "0 18px 60px rgba(0,0,0,0.18)",
    padding: 16,
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
};
