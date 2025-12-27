import { useState } from "react";
import { apiFetch, setToken } from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    // 这里假设后端有 JWT 登录接口：POST /api/token/
    const res = await apiFetch("/api/auth/token/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: {}, // apiFetch 会补 Content-Type
    });

    if (!res.ok) {
      setMsg(`登录失败（HTTP ${res.status}）：${JSON.stringify(res.data)}`);
      return;
    }

    // SimpleJWT 返回: { access, refresh }
    const access = res.data?.access;
    if (!access) {
      setMsg("登录接口返回里没有 access token");
      return;
    }

    setToken(access);
    nav("/jobs");
  }

  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <button style={{ padding: "8px 12px" }}>Sign in</button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <p style={{ marginTop: 12, opacity: 0.7 }}>
        登录成功后会跳转到 Jobs 页面，并自动带上 Bearer Token 请求后端。
      </p>
    </div>
  );
}
