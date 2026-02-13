import React, { useState } from "react";

/* ---------------- UTIL ---------------- */

function safeParse(str) {
  try {
    return JSON.parse(str || "{}");
  } catch {
    return {};
  }
}

function PrettyJSON({ data }) {
  return <pre style={jsonStyle}>{JSON.stringify(data, null, 2)}</pre>;
}

/* ---------------- COMPONENT ---------------- */

export default function LogDetailModal({ log, onClose }) {
  const [headerFilter, setHeaderFilter] = useState("");

  if (!log) return null;

  const headers = safeParse(log.headers_json);
  const cf = safeParse(log.cf_json);

  const filteredHeaders = Object.entries(headers).filter(([key]) =>
    key.toLowerCase().includes(headerFilter.toLowerCase()),
  );

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button style={closeBtnStyle} onClick={onClose}>
          ✕
        </button>

        <h2 style={titleStyle}>Request Detail</h2>

        {/* REQUEST OVERVIEW */}
        <Section title="Request Overview">
          <Grid>
            <Field label="Request ID" value={log.request_id} />
            <Field label="Timestamp" value={log.ts} />
            <Field label="Method" value={log.method} />
            <Field label="URL" value={log.url} />
            <Field label="Path" value={log.path} />
            <Field label="Status" value={log.status} />
            <Field label="Latency" value={`${log.latency_ms} ms`} />
          </Grid>
        </Section>

        {/* CLIENT INFO */}
        <Section title="Client Information">
          <Grid>
            <Field label="IP Address" value={log.ip} />
            <Field label="Country" value={log.country} />
            <Field label="City" value={log.city} />
            <Field label="ASN" value={cf.asn} />
            <Field label="ISP" value={cf.asOrganization} />
            <Field label="User Agent" value={headers["user-agent"]} />
          </Grid>
        </Section>

        {/* NETWORK & TLS */}
        <Section title="Network & TLS">
          <Grid>
            <Field label="HTTP Protocol" value={cf.httpProtocol} />
            <Field label="TLS Version" value={cf.tlsVersion} />
            <Field label="TLS Cipher" value={cf.tlsCipher} />
            <Field label="TCP RTT" value={cf.clientTcpRtt} />
            <Field label="Keep Alive" value={cf.edgeRequestKeepAliveStatus} />
          </Grid>
        </Section>

        {/* GEO LOCATION */}
        <Section title="Geolocation (Edge)">
          <Grid>
            <Field label="Colo (Data Center)" value={cf.colo} />
            <Field label="Region" value={cf.region} />
            <Field label="Timezone" value={cf.timezone} />
            <Field label="Latitude" value={cf.latitude} />
            <Field label="Longitude" value={cf.longitude} />
            <Field label="Postal Code" value={cf.postalCode} />
          </Grid>
        </Section>

        {/* TLS DETAILS */}
        <Section title="TLS Deep Details">
          <PrettyJSON data={cf.tlsExportedAuthenticator} />
        </Section>

        {/* REQUEST HEADERS */}
        <Section title="Request Headers">
          <input
            placeholder="Search header..."
            value={headerFilter}
            onChange={(e) => setHeaderFilter(e.target.value)}
            style={searchStyle}
          />
          {filteredHeaders.map(([key, value]) => (
            <HeaderRow key={key} name={key} value={value} />
          ))}
        </Section>
      </div>
    </div>
  );
}

/* ---------------- UI COMPONENTS ---------------- */

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
  background: "rgba(0,0,0,0.55)",
  backdropFilter: "blur(6px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "#fff",
  width: "95%",
  maxWidth: "1100px",
  maxHeight: "90vh",
  overflowY: "auto",
  padding: "40px",
  borderRadius: "24px",
  boxShadow: "0 40px 100px rgba(0,0,0,0.3)",
  position: "relative",
};

const titleStyle = {
  marginBottom: 30,
  fontSize: 26,
  fontWeight: 700,
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
};

const sectionStyle = {
  background: "#f8fafc",
  padding: 24,
  borderRadius: 18,
  marginBottom: 30,
};

const sectionTitle = {
  marginBottom: 20,
  fontSize: 18,
  fontWeight: 600,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 20,
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
};

const fieldLabel = {
  fontSize: 12,
  color: "#6b7280",
};

const fieldValue = {
  fontSize: 14,
  fontWeight: 500,
  wordBreak: "break-word",
};

const headerRowStyle = {
  marginBottom: 10,
  paddingBottom: 8,
  borderBottom: "1px solid #e5e7eb",
};

const headerKey = {
  fontWeight: 600,
};

const headerValue = {
  fontSize: 13,
  wordBreak: "break-word",
};

const searchStyle = {
  width: "100%",
  padding: 8,
  marginBottom: 15,
  borderRadius: 8,
  border: "1px solid #ddd",
};

const jsonStyle = {
  background: "#111",
  color: "#0f0",
  padding: 16,
  borderRadius: 12,
  fontSize: 12,
  overflowX: "auto",
};
