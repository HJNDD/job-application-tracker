import { useState } from "react";
import { apiFetch } from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!username.trim()) return setMsg("Username 不能为空");
    if (password.length < 6) return setMsg("Password 至少 6 位");
    if (password !== password2) return setMsg("两次密码不一致");

    setLoading(true);
    try {
      // ⚠️ 默认假设后端是 POST /api/auth/register/
      const res = await apiFetch("/api/auth/register/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
        headers: {},
      });

      if (!res.ok) {
        setMsg(`注册失败（HTTP ${res.status}）：${JSON.stringify(res.data)}`);
        return;
      }

      // 注册成功：回到 login
      nav("/login");
    } catch (e) {
      setMsg(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <form onSubmit={onSubmit} style={styles.card}>
        <h2 style={{ marginBottom: 16 }}>Create account</h2>
        <p style={styles.sub}>Register to start tracking jobs</p>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <input
          type="password"
          placeholder="Confirm password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          style={styles.input}
        />

        <button disabled={loading} style={styles.button}>
          {loading ? "Creating..." : "Create account"}
        </button>

        {msg && <p style={styles.error}>{msg}</p>}

        <p style={styles.bottom}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f6f7fb",
  },
  card: {
    width: 380,
    padding: 28,
    borderRadius: 12,
    background: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  sub: {
    marginTop: -8,
    marginBottom: 12,
    color: "#666",
    fontSize: 14,
  },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
  },
  button: {
    marginTop: 8,
    padding: "10px",
    borderRadius: 8,
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontSize: 15,
    cursor: "pointer",
  },
  error: {
    marginTop: 8,
    color: "#dc2626",
    fontSize: 14,
  },
  bottom: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
  link: { color: "#4f46e5", textDecoration: "none" },
};
