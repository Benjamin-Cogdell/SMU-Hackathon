// src/App.jsx
import React, { useEffect, useRef, useState } from "react";

const Pill = ({ children }) => (
  <span style={{
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "9999px",
    padding: "4px 10px",
    fontSize: 12,
    border: "1px solid #ddd",
    marginRight: 6,
    marginBottom: 6
  }}>{children}</span>
);

const Section = ({ title, right, children }) => (
  <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, background: "#fff" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h2>
      {right}
    </div>
    {children}
  </div>
);

const ProgressBar = ({ value = 0 }) => (
  <div style={{ height: 8, width: "100%", background: "#eee", borderRadius: 8 }}>
    <div style={{
      height: 8,
      width: `${Math.max(0, Math.min(100, value * 100)).toFixed(0)}%`,
      background: "#111",
      borderRadius: 8
    }} />
  </div>
);

export default function App() {
  // Set your teammate’s WebSocket URL when ready.
  const wsUrl = ""; // e.g., wss://your-api.example.com/live-summary
  const [status, setStatus] = useState("disconnected");
  const [data, setData] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!wsUrl) return; // no backend yet = just shows placeholders
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setStatus("connecting");

    ws.onopen = () => setStatus("connected");
    ws.onclose = () => setStatus("disconnected");
    ws.onerror = () => setStatus("error");
    ws.onmessage = (evt) => {
      try {
        const incoming = JSON.parse(evt.data);
        setData(incoming);
      } catch (e) {
        console.error("Invalid JSON from WS", e);
      }
    };
    return () => ws.close();
  }, [wsUrl]);

  const priority = data?.priority ?? "-";
  const priorityStyle = {
    1: { background: "#dc2626", color: "white" },
    2: { background: "#f59e0b", color: "black" },
    3: { background: "#059669", color: "white" }
  }[priority] || { background: "#e5e7eb", color: "black" };

  return (
  <div style={{ minHeight: "100vh", background: "#f9fafb", color: "#111" }}>
    {/* LEFT HALF CONTAINER */}
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: "50vw",
        overflow: "auto",
        padding: 24,
      }}
    >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>First Responder Live Summary</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, textTransform: "capitalize" }}>
            <span style={{
              width: 8, height: 8, borderRadius: 9999,
              background: status === "connected" ? "#10b981" :
                          status === "connecting" ? "#f59e0b" :
                          status === "error" ? "#dc2626" : "#9ca3af"
            }}/>
            {status}
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          {/* Summary */}
          <Section
            title="Incident Summary"
            right={<span style={{
              ...priorityStyle,
              borderRadius: 9999, padding: "4px 10px", fontSize: 12, fontWeight: 600
            }}>Priority {priority}</span>}
          >
            <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {data?.summary || "Waiting for incoming summary..."}
            </p>
            {typeof data?.confidence === "number" && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Model confidence</div>
                <ProgressBar value={data.confidence} />
                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
                  {Math.round(data.confidence * 100)}%
                </div>
              </div>
            )}
          </Section>

          {/* Key details, Evidence, Transcript */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
            <Section title="Key Details">
              <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
                <Row label="Location" value={data?.location_guess} />
                <Row label="Units" pills={data?.units_recommended} />
                <Row label="Hazards" pills={data?.hazards} />
                <Row label="Medical" pills={data?.medical_flags} />
              </div>
            </Section>

            <Section title="SOP Evidence">
              {(data?.sop_citations || []).length
                ? (data.sop_citations).map((c, i) => (
                    <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, marginBottom: 10, background: "#fafafa" }}>
                      <div style={{ fontWeight: 600 }}>{c.title}{c.section ? ` — ${c.section}` : ""}</div>
                      <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>{c.excerpt}</div>
                    </div>
                  ))
                : <div style={{ fontSize: 13, opacity: 0.6 }}>No SOP citations yet.</div>}
            </Section>

            <Section title="Rolling Transcript">
              <pre style={{
                maxHeight: 240, overflow: "auto", whiteSpace: "pre-wrap",
                background: "#f3f4f6", padding: 12, borderRadius: 12, fontSize: 13
              }}>
{data?.transcript_window || "(no transcript yet)"}
              </pre>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, pills }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <span style={{ width: 90, opacity: 0.6 }}>{label}</span>
      {Array.isArray(pills) ? (
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {pills.length ? pills.map((p, i) => <Pill key={i}>{p}</Pill>) : <span>—</span>}
        </div>
      ) : (
        <span style={{ fontWeight: 500 }}>{value || "—"}</span>
      )}
    </div>
  );
}
