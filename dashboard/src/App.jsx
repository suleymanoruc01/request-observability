import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import LogDetailModal from "./components/LogDetailModal";
import "./App.css";

const API_URL = "https://api.suleymanoruc00.workers.dev/logs";

export default function App() {
  const [logs, setLogs] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pathFilter, setPathFilter] = useState("");

  /* ---------------- FETCH ---------------- */

  const fetchLogs = async (cursor = null, append = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const url = cursor
        ? `${API_URL}?limit=20&cursor=${encodeURIComponent(cursor)}`
        : `${API_URL}?limit=20`;

      const res = await fetch(url);
      const data = await res.json();

      setLogs((prev) => (append ? [...prev, ...data.data] : data.data));
      setNextCursor(data.next_cursor || null);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  /* ---------------- INITIAL LOAD + REALTIME ---------------- */

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const res = await fetch(`${API_URL}?limit=20`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setLogs(data.data);
        setNextCursor(data.next_cursor || null);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
        }
      }
    };

    load();

    const interval = setInterval(load, 5000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  /* ---------------- FILTERING ---------------- */

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchStatus =
        statusFilter === "ALL" ||
        log.status.toString().startsWith(statusFilter);

      const matchPath =
        pathFilter === "" ||
        log.path.toLowerCase().includes(pathFilter.toLowerCase());

      return matchStatus && matchPath;
    });
  }, [logs, statusFilter, pathFilter]);

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

  const chartData = [
    { name: "2xx", value: statusCounts[2], color: "#2ecc71" },
    { name: "3xx", value: statusCounts[3], color: "#f1c40f" },
    { name: "4xx", value: statusCounts[4], color: "#e67e22" },
    { name: "5xx", value: statusCounts[5], color: "#e74c3c" },
  ];

  /* ---------------- PATH METRICS ---------------- */

  const pathErrorRate = useMemo(() => {
    const stats = {};

    logs.forEach((log) => {
      if (!stats[log.path]) {
        stats[log.path] = { total: 0, errors: 0 };
      }

      stats[log.path].total++;
      if (log.status >= 400) stats[log.path].errors++;
    });

    return Object.entries(stats).map(([path, data]) => ({
      path,
      total: data.total,
      errors: data.errors,
      errorRate: ((data.errors / data.total) * 100).toFixed(1),
    }));
  }, [logs]);

  const pathDistribution = useMemo(() => {
    const counts = {};

    logs.forEach((log) => {
      if (!counts[log.path]) counts[log.path] = 0;
      counts[log.path]++;
    });

    return Object.entries(counts).map(([path, count]) => ({
      path,
      count,
    }));
  }, [logs]);

  return (
    <div style={{ padding: "40px", background: "#f3f4f6", minHeight: "100vh", color: "#000",  }}>
      <h1 style={{ marginBottom: 30 }}>Request Observability Dashboard</h1>

      {/* STATUS CARDS */}
      <div style={{ display: "flex", gap: 15, marginBottom: 25 }}>
        <StatusCard color="#2ecc71" label="2xx" count={statusCounts[2]} />2
        <StatusCard color="#f1c40f" label="3xx" count={statusCounts[3]} />
        <StatusCard color="#e67e22" label="4xx" count={statusCounts[4]} />
        <StatusCard color="#e74c3c" label="5xx" count={statusCounts[5]} />
      </div>

      {/* STATUS BAR CHART */}
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

      {/* PATH METRICS */}
      <h3>Path Metrics</h3>
      <table border="1" cellPadding="8" style={{ marginBottom: 40, width: "100%" }}>
        <thead>
          <tr>
            <th>Path</th>
            <th>Total</th>
            <th>Errors</th>
            <th>Error %</th>
          </tr>
        </thead>
        <tbody>
          {pathErrorRate.map((p) => (
            <tr key={p.path}>
              <td>{p.path}</td>
              <td>{p.total}</td>
              <td>{p.errors}</td>
              <td style={{ color: p.errorRate > 20 ? "red" : "black" }}>
                {p.errorRate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PATH TRAFFIC */}
      <h3>Path Traffic</h3>
      <div style={{ width: "100%", height: 300, marginBottom: 40 }}>
        <ResponsiveContainer>
          <BarChart data={pathDistribution}>
            <XAxis dataKey="path" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* FILTERS */}
      <div style={{ marginBottom: 20 }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="2">2xx</option>
          <option value="3">3xx</option>
          <option value="4">4xx</option>
          <option value="5">5xx</option>
        </select>

        <input
          type="text"
          placeholder="Filter by path..."
          value={pathFilter}
          onChange={(e) => setPathFilter(e.target.value)}
          style={{ marginLeft: 10 }}
        />
      </div>

      {/* TABLE */}
      <table border="1" cellPadding="8" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Time</th>
            <th>Method</th>
            <th>Path</th>
            <th>Status</th>
            <th>Latency</th>
            <th>Country</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((log) => (
            <tr
              key={log.request_id}
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedLog(log)}
            >
              <td>{log.ts}</td>
              <td>{log.method}</td>
              <td>{log.path}</td>
              <td>
                <StatusBadge status={log.status} />
              </td>
              <td>{log.latency_ms}</td>
              <td>{log.country}</td>
              <td>{log.ip}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* LOAD MORE */}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <button
          onClick={() => fetchLogs(nextCursor, true)}
          disabled={!nextCursor || loading}
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      </div>

      {/* DETAIL MODAL */}
      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
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
  const color =
    status >= 500
      ? "#e74c3c"
      : status >= 400
      ? "#f39c12"
      : status >= 300
      ? "#3498db"
      : "#2ecc71";

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
