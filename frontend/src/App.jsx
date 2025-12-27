import { useEffect, useState } from "react";

export default function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/ping/")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setData({ error: String(e) }));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Frontend ↔ Backend</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
