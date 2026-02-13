import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import "./App.css";
import LogDetailModal from "./components/LogDetailModal";

const API_URL = "https://api.suleymanoruc00.workers.dev/logs";

export default function App() {
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [allLogs, setAllLogs] = useState([]);
  const [displayLimit, setDisplayLimit] = useState(10);

  /* ---------------- INITIAL LOAD + POLLING ---------------- */

  useEffect(() => {
    let isMounted = true;

    const fetchInitial = async () => {
      try {
        const res = await fetch(`${API_URL}?limit=10`);
        const data = await res.json();

        if (!isMounted) return;

        setAllLogs(data.data);
        setNextCursor(data.next_cursor || null);
      } catch (err) {
        console.error(err);
      }
    };

    fetchInitial();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}?limit=10`);
        const data = await res.json();

        setAllLogs((prev) => {
          const existingIds = new Set(prev.map((l) => l.request_id));

          const uniqueNewLogs = data.data.filter((log) => !existingIds.has(log.request_id));

          if (uniqueNewLogs.length === 0) return prev;

          return [...uniqueNewLogs, ...prev];
        });
      } catch (err) {
        console.error(err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- LOAD MORE ---------------- */

  const fetchMore = async () => {
    if (!nextCursor || loading) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}?limit=10&cursor=${encodeURIComponent(nextCursor)}`);
      const data = await res.json();

      setAllLogs((prev) => [...prev, ...data.data]);
      setDisplayLimit((prev) => prev + 10);
      setNextCursor(data.next_cursor || null);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  const logs = useMemo(() => {
    return allLogs.slice(0, displayLimit);
  }, [allLogs, displayLimit]);

  /* ---------------- STATUS COUNTS ---------------- */

  const statusCounts = useMemo(() => {
    const counts = { 2: 0, 3: 0, 4: 0, 5: 0 };

    logs.forEach((log) => {
      const firstDigit = log.status.toString()[0];
      if (counts[firstDigit] !== undefined) {
        counts[firstDigit]++;
      }
    });

    return counts;
  }, [logs]);

  /* ---------------- PATH METRICS ---------------- */

  const pathMetrics = useMemo(() => {
    const stats = {};

    logs.forEach((log) => {
      if (!stats[log.path]) {
        stats[log.path] = {
          total: 0,
          errors: 0,
          latencies: [],
        };
      }

      stats[log.path].total++;

      if (log.status >= 400) {
        stats[log.path].errors++;
      }

      stats[log.path].latencies.push(log.latency_ms);
    });

    return Object.entries(stats)
      .map(([path, data]) => {
        const sortedLatencies = [...data.latencies].sort((a, b) => a - b);

        const avgLatency = data.latencies.reduce((sum, val) => sum + val, 0) / data.latencies.length;

        const minLatency = sortedLatencies[0];
        const maxLatency = sortedLatencies[sortedLatencies.length - 1];

        const p95Index = Math.floor(sortedLatencies.length * 0.95) - 1;
        const p95Latency = sortedLatencies[Math.max(0, p95Index)];

        return {
          path,
          total: data.total,
          errors: data.errors,
          errorRate: data.total ? ((data.errors / data.total) * 100).toFixed(1) : 0,
          avgLatency: Math.round(avgLatency),
          minLatency,
          maxLatency,
          p95Latency,
        };
      })
      .sort((a, b) => {
        if (a.path === "/") return -1;
        if (b.path === "/") return 1;
        return a.path.localeCompare(b.path);
      });
  }, [logs]);

  const chartData = [
    { name: "2xx", value: statusCounts[2], color: "#2ecc71" },
    { name: "3xx", value: statusCounts[3], color: "#f1c40f" },
    { name: "4xx", value: statusCounts[4], color: "#e67e22" },
    { name: "5xx", value: statusCounts[5], color: "#e74c3c" },
  ];

  return (
    <div style={pageWrapper}>
      <div style={pageContainer}>
        <h1 style={{ marginBottom: 30 }}>Request Observability Dashboard</h1>

        {/* STATUS CARDS */}
        <div style={{ display: "flex", gap: 15, marginBottom: 25 }}>
          <StatusCard color="#2ecc71" label="2xx" count={statusCounts[2]} />
          <StatusCard color="#f1c40f" label="3xx" count={statusCounts[3]} />
          <StatusCard color="#e67e22" label="4xx" count={statusCounts[4]} />
          <StatusCard color="#e74c3c" label="5xx" count={statusCounts[5]} />
        </div>

        {/* CHART */}
        <div style={{ width: "100%", height: 250, marginBottom: 40 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PATH DISTRIBUTION & ERROR RATE */}
        <h2 style={{ marginBottom: 20 }}>Path Metrics</h2>

        <div style={pathTableContainer}>
          <table style={pathTable}>
            <thead>
              <tr>
                <th>Path</th>
                <th>Total</th>
                <th>Errors</th>
                <th>Error %</th>
                <th>Avg (ms)</th>
                <th>P95 (ms)</th>
                <th>Min</th>
                <th>Max</th>
              </tr>
            </thead>
            <tbody>
              {pathMetrics.map((item) => (
                <tr key={item.path}>
                  <td style={{ fontWeight: 600 }}>{item.path}</td>
                  <td>{item.total}</td>
                  <td style={{ color: item.errors > 0 ? "#e74c3c" : "#2ecc71" }}>{item.errors}</td>
                  <td
                    style={{
                      color: item.errorRate > 20 ? "#e74c3c" : item.errorRate > 5 ? "#f39c12" : "#2ecc71",
                      fontWeight: 600,
                    }}
                  >
                    {item.errorRate}%
                  </td>

                  <td>{item.avgLatency}</td>

                  <td
                    style={{
                      color: item.p95Latency > 500 ? "#e74c3c" : item.p95Latency > 200 ? "#f39c12" : "#2ecc71",
                      fontWeight: 600,
                    }}
                  >
                    {item.p95Latency}
                  </td>

                  <td>{item.minLatency}</td>
                  <td>{item.maxLatency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABLE */}
        <div style={{ overflowX: "auto" }}>
          <table border="1" cellPadding="8" style={{ width: "100%", minWidth: 800 }}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Method</th>
                <th>Path</th>
                <th>Status</th>
                <th>Latency</th>
                <th>Country</th>
                <th>IP</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.request_id}>
                  <td>{formatTimestamp(log.ts)}</td>
                  <td>{log.method}</td>
                  <td>{log.path}</td>
                  <td>
                    <StatusBadge status={log.status} />
                  </td>
                  <td>{log.latency_ms}</td>
                  <td>{log.country}</td>
                  <td>{log.ip}</td>
                  <td>
                    <span
                      style={{
                        color: "#3b82f6",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                      onClick={() => setSelectedLog(log)}
                    >
                      Detail
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* LOAD MORE */}
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button
            className="load-more-btn"
            onClick={fetchMore}
            disabled={!nextCursor || loading}
            style={{
              background: loading || !nextCursor ? "#ccc" : "#111",
              color: "#fff",
              border: "none",
              padding: "12px 28px",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading || !nextCursor ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
        {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
      </div>
    </div>
  );
}

function formatTimestamp(ts) {
  if (!ts) return "-";

  const date = new Date(ts.replace(" ", "T"));

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

  return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds} - ${milliseconds}`;
}

/* ---------------- COMPONENTS ---------------- */

function StatusCard({ color, label, count }) {
  return (
    <div
      style={{
        background: color,
        color: "white",
        padding: 15,
        borderRadius: 8,
        width: 120,
        textAlign: "center",
        fontWeight: 600,
      }}
    >
      {label}
      <div style={{ fontSize: 20 }}>{count}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const color = status >= 500 ? "#e74c3c" : status >= 400 ? "#f39c12" : status >= 300 ? "#3498db" : "#2ecc71";

  return (
    <span
      style={{
        background: color,
        color: "white",
        padding: "4px 8px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  );
}

const pathTableContainer = {
  background: "#fff",
  padding: 20,
  borderRadius: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  marginBottom: 40,
};

const pathTable = {
  width: "100%",
  borderCollapse: "collapse",
};

const pageWrapper = {
  background: "#f3f4f6",
  minHeight: "100vh",
  padding: "40px 20px",
  display: "flex",
  justifyContent: "center",
  color: "#111", // 🔥 sabitle
};

const pageContainer = {
  width: "100%",
  maxWidth: "1200px",
};

// const progressBarOuter = {
//   height: 10,
//   background: "#e5e7eb",
//   borderRadius: 8,
//   overflow: "hidden",
// };

// const progressBarInner = {
//   height: "100%",
//   transition: "width 0.3s ease",
// };
