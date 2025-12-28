import { useState } from "react";
import { apiFetch, setToken } from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/token/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
        headers: {},
      });

      if (!res.ok) {
        setMsg("用户名或密码错误");
        return;
      }

      const access = res.data?.access;
      if (!access) {
        setMsg("登录接口返回异常");
        return;
      }

      setToken(access);
      nav("/jobs");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <form onSubmit={onSubmit} style={styles.card}>
        <h2 style={{marginBottom: 16}}>Job Tracker</h2>
        <p style={styles.sub}>Sign in to continue</p>

        <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
        />

        <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
        />

        <button disabled={loading} style={styles.button}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        {msg && <p style={styles.error}>{msg}</p>}
        <p style={{marginTop: 12, fontSize: 14, color: "#666"}}>
          New here?{" "}
          <a href="/register" style={{color: "#4f46e5", textDecoration: "none"}}>
            Create an account
          </a>
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
    width: 360,
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
};
