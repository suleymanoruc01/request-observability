import React from "react";

/* ---------------- UTIL ---------------- */

function safeParse(str) {
  try {
    return JSON.parse(str || "{}");
  } catch {
    return {};
  }
}

/* ---------------- COMPONENT ---------------- */

export default function LogDetailModal({ log, onClose }) {
  if (!log) return null;

  const headers = safeParse(log.headers_json);
  const cf = safeParse(log.cf_json);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        
        {/* CLOSE BUTTON */}
        <button style={closeBtnStyle} onClick={onClose}>
          ✕
        </button>

        <h2 style={titleStyle}>Request Detail</h2>

        {/* SUMMARY */}
        <Section title="Summary">
          <Grid>
            <Field label="Request ID" value={log.request_id} />
            <Field label="Time" value={log.ts} />
            <Field label="Method" value={log.method} />
            <Field label="Path" value={log.path} />
            <Field label="Status" value={log.status} />
            <Field label="Latency" value={`${log.latency_ms} ms`} />
            <Field label="Country" value={log.country} />
            <Field label="IP" value={log.ip} />
          </Grid>
        </Section>

        {/* CLOUDFLARE EDGE */}
        <Section title="Cloudflare Edge Metadata">
          <Grid>
            {Object.entries(cf).map(([key, value]) => (
              <Field key={key} label={key} value={String(value)} />
            ))}
          </Grid>
        </Section>

        {/* USER AGENT */}
        <Section title="User Agent">
          <MonoBlock>{headers["user-agent"] || "—"}</MonoBlock>
        </Section>

        {/* HEADERS */}
        <Section title="Request Headers">
          {Object.entries(headers).map(([key, value]) => (
            <HeaderRow key={key} name={key} value={value} />
          ))}
        </Section>

      </div>
    </div>
  );
}

/* ---------------- UI BUILDING BLOCKS ---------------- */

function Section({ title, children }) {
  return (
    <div style={sectionStyle}>
      <h3 style={sectionTitle}>{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }) {
  return <div style={gridStyle}>{children}</div>;
}

function Field({ label, value }) {
  return (
    <div style={fieldStyle}>
      <div style={fieldLabel}>{label}</div>
      <div style={fieldValue}>{value || "—"}</div>
    </div>
  );
}

function MonoBlock({ children }) {
  return (
    <div style={monoStyle}>
      {children}
    </div>
  );
}

function HeaderRow({ name, value }) {
  return (
    <div style={headerRowStyle}>
      <div style={headerKey}>{name}</div>
      <div style={headerValue}>{value}</div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  backdropFilter: "blur(4px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "#ffffff",
  width: "75%",
  maxWidth: "1000px",
  maxHeight: "85vh",
  overflowY: "auto",
  padding: "40px",
  borderRadius: "20px",
  boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
  position: "relative",
};

const titleStyle = {
  marginBottom: 30,
  fontSize: 26,
  fontWeight: 700,
  color: "#111",
};

const closeBtnStyle = {
  position: "absolute",
  top: 20,
  right: 20,
  background: "#111",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "6px 12px",
  cursor: "pointer",
  fontSize: 14,
};

const sectionStyle = {
  background: "#f9fafb",
  padding: 24,
  borderRadius: 16,
  marginBottom: 30,
};

const sectionTitle = {
  marginBottom: 20,
  fontSize: 18,
  fontWeight: 600,
  color: "#111",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 20,
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
};

const fieldLabel = {
  fontSize: 12,
  color: "#6b7280",
  marginBottom: 6,
};

const fieldValue = {
  fontSize: 14,
  fontWeight: 500,
  color: "#111",
  wordBreak: "break-word",
};

const monoStyle = {
  fontFamily: "monospace",
  background: "#111",
  color: "#0f0",
  padding: 14,
  borderRadius: 10,
  fontSize: 13,
  overflowX: "auto",
};

const headerRowStyle = {
  marginBottom: 12,
  paddingBottom: 10,
  borderBottom: "1px solid #e5e7eb",
};

const headerKey = {
  fontWeight: 600,
  color: "#111",
};

const headerValue = {
  fontSize: 13,
  color: "#374151",
  wordBreak: "break-word",
};
