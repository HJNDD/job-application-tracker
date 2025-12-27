import { useEffect, useState } from "react";
import { apiFetch, clearToken } from "../api";
import { useNavigate } from "react-router-dom";

export default function Jobs() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  async function load() {
    setMsg("");
    try {
      const res = await apiFetch("/api/jobs/"); // 你的 router 注册 jobs 后就是这个
      if (!res.ok) {
        setMsg(`加载失败（HTTP ${res.status}）：${JSON.stringify(res.data)}`);
        return;
      }
      // 如果你用了 DRF 分页，数据在 res.data.results；没分页就是数组
      const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
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

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Jobs</h2>
        <button onClick={load}>Refresh</button>
        <button
          onClick={() => {
            clearToken();
            nav("/login");
          }}
        >
          Logout
        </button>
      </div>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <ul style={{ marginTop: 16 }}>
        {items.map((j) => (
          <li key={j.id} style={{ marginBottom: 10 }}>
            <b>{j.company}</b> — {j.title} | <span>{j.status}</span>
          </li>
        ))}
      </ul>

      {!items.length && !msg && <p style={{ marginTop: 16 }}>暂无数据（或者你还没创建 job）。</p>}
    </div>
  );
}
