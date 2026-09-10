import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight, Check, ChevronDown, ChevronUp, CircleAlert, Download,
  FileSpreadsheet, LoaderCircle, Map, Plus, RotateCcw, Sparkles, Trash2, Upload, X,
} from "lucide-react";
import "./styles.css";

const SAMPLE_ROWS = [
  { id: crypto.randomUUID(), city: "London", country: "United Kingdom", neighbourhoods: "Kings Cross, Little Venice" },
  { id: crypto.randomUUID(), city: "Vancouver", country: "Canada", neighbourhoods: "Gastown, Kitsilano" },
];

const blankRow = () => ({ id: crypto.randomUUID(), city: "", country: "", neighbourhoods: "" });
const splitNeighbourhoods = (value) => String(value || "").split(/[,;\n]/).map((v) => v.trim()).filter(Boolean);
const normalizeHeader = (value) => String(value || "").toLowerCase().replace(/[^a-z]/g, "");

function pickField(row, candidates) {
  const entries = Object.entries(row);
  const match = entries.find(([key]) => candidates.includes(normalizeHeader(key)));
  return match ? String(match[1] ?? "").trim() : "";
}

function parseWorkbook(XLSX, arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const preferred = workbook.SheetNames.find((name) => name.toLowerCase() === "input") || workbook.SheetNames[0];
  const sheet = workbook.Sheets[preferred];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", range: 3 });
  return rows.map((row) => ({
    id: crypto.randomUUID(),
    city: pickField(row, ["city"]),
    country: pickField(row, ["country"]),
    neighbourhoods: pickField(row, ["neighbourhoodslist", "neighbourhoodlist", "neighbourhoods", "neighborhoodslist", "neighborhoods", "nhs"]),
  })).filter((row) => row.city || row.country || row.neighbourhoods);
}

function App() {
  const [rows, setRows] = useState(SAMPLE_ROWS);
  const [jobs, setJobs] = useState({});
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState("");
  const [expanded, setExpanded] = useState({});
  const [activeTab, setActiveTab] = useState("setup");
  const stopRef = useRef(false);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  const validRows = useMemo(() => rows.filter((row) => row.city && row.country && splitNeighbourhoods(row.neighbourhoods).length), [rows]);
  const totalNeighbourhoods = useMemo(() => validRows.reduce((sum, row) => sum + splitNeighbourhoods(row.neighbourhoods).length, 0), [validRows]);
  const completed = Object.values(jobs).filter((status) => status === "done").length;

  function updateRow(id, field, value) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [field]: value } : row));
  }

  async function uploadFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const XLSXModule = await import("xlsx");
      const XLSX = XLSXModule.default || XLSXModule;
      const parsed = parseWorkbook(XLSX, await file.arrayBuffer());
      if (!parsed.length) throw new Error("No city, country, and neighbourhood rows were found.");
      setRows(parsed.slice(0, 100));
      setJobs({});
      setResults({});
      setNotice(`${parsed.length} rows imported from ${file.name}`);
    } catch (error) {
      setNotice(error.message || "Could not read that spreadsheet.");
    }
  }

  async function generateRow(row) {
    setJobs((current) => ({ ...current, [row.id]: "running" }));
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, neighbourhoods: splitNeighbourhoods(row.neighbourhoods) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Generation failed");
      setResults((current) => ({ ...current, [row.id]: payload.neighbourhoods }));
      setJobs((current) => ({ ...current, [row.id]: "done" }));
      setExpanded((current) => ({ ...current, [row.id]: true }));
    } catch (error) {
      setJobs((current) => ({ ...current, [row.id]: "error" }));
      setResults((current) => ({ ...current, [row.id]: { error: error.message } }));
    }
  }

  async function generateAll() {
    if (!validRows.length) return setNotice("Add at least one complete row first.");
    setRunning(true);
    stopRef.current = false;
    setActiveTab("review");
    const queue = [...validRows];
    const worker = async () => {
      while (queue.length && !stopRef.current) await generateRow(queue.shift());
    };
    await Promise.all([worker(), worker()]);
    setRunning(false);
  }

  function stopGeneration() {
    stopRef.current = true;
    setRunning(false);
    setNotice("The queue was stopped. Requests already in progress will finish.");
  }

  function updateResult(rowId, index, patch) {
    setResults((current) => ({
      ...current,
      [rowId]: current[rowId].map((item, i) => i === index ? { ...item, ...patch } : item),
    }));
  }

  async function exportFile(format) {
    const exportRows = rows.filter((row) => Array.isArray(results[row.id])).map((row) => ({
      city: row.city,
      country: row.country,
      "neighbourhoods list": row.neighbourhoods,
      "neighbourhoods desc": JSON.stringify(results[row.id]),
      status: "Done",
    }));
    if (!exportRows.length) return setNotice("Generate at least one row before exporting.");
    const XLSXModule = await import("xlsx");
    const XLSX = XLSXModule.default || XLSXModule;
    const sheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Input");
    XLSX.writeFile(workbook, `neighbourhood-content.${format}`, { bookType: format });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Neighbourhood Studio home">
          <span className="brand-mark"><Map size={19} strokeWidth={2.2} /></span>
          <span>Neighbourhood <strong>Studio</strong></span>
        </a>
        <div className="topbar-actions">
          <span className="secure"><span /> API secured server-side</span>
          <button className="ghost-button" onClick={() => setRows([blankRow()])}><RotateCcw size={16} /> New batch</button>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="eyebrow"><Sparkles size={14} /> ToursByLocals content tool</div>
          <h1>Turn neighbourhood lists into<br /><em>travel-ready stories.</em></h1>
          <p>Upload a spreadsheet or add places below. Generate consistent descriptions, audience tags and top experiences in one reviewable batch.</p>
        </section>

        <nav className="steps" aria-label="Workflow">
          <button className={activeTab === "setup" ? "active" : ""} onClick={() => setActiveTab("setup")}><span>1</span> Add places</button>
          <div className="step-line" />
          <button className={activeTab === "review" ? "active" : ""} onClick={() => setActiveTab("review")}><span>2</span> Generate & review</button>
          <div className="step-line" />
          <button className={activeTab === "export" ? "active" : ""} onClick={() => setActiveTab("export")}><span>3</span> Export</button>
        </nav>

        {activeTab === "setup" && (
          <section className="panel setup-panel">
            <div className="panel-head">
              <div><p className="kicker">Batch setup</p><h2>Add cities and neighbourhoods</h2></div>
              <label className="upload-button"><Upload size={17} /> Import Excel / CSV<input type="file" accept=".xlsx,.xls,.csv" onChange={uploadFile} /></label>
            </div>
            <div className="hint"><FileSpreadsheet size={17} /><span>Excel columns are detected automatically. Use one row per city and separate neighbourhoods with commas.</span></div>
            <div className="row-list">
              <div className="row-head"><span>City</span><span>Country</span><span>Neighbourhoods</span><span /></div>
              {rows.map((row, index) => (
                <div className="input-row" key={row.id}>
                  <div className="mobile-index">{String(index + 1).padStart(2, "0")}</div>
                  <input value={row.city} onChange={(e) => updateRow(row.id, "city", e.target.value)} placeholder="e.g. London" />
                  <input value={row.country} onChange={(e) => updateRow(row.id, "country", e.target.value)} placeholder="e.g. United Kingdom" />
                  <input value={row.neighbourhoods} onChange={(e) => updateRow(row.id, "neighbourhoods", e.target.value)} placeholder="e.g. Kings Cross, Little Venice" />
                  <button className="icon-button" aria-label="Remove row" onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}><Trash2 size={17} /></button>
                </div>
              ))}
            </div>
            <button className="add-button" onClick={() => setRows((current) => [...current, blankRow()])}><Plus size={17} /> Add another city</button>
            <div className="panel-footer">
              <div><strong>{validRows.length}</strong> ready rows <span>·</span> <strong>{totalNeighbourhoods}</strong> neighbourhoods</div>
              <button className="primary-button" onClick={generateAll} disabled={!validRows.length}><Sparkles size={17} /> Generate content <ArrowRight size={17} /></button>
            </div>
          </section>
        )}

        {activeTab === "review" && (
          <section className="review-wrap">
            <div className="review-head">
              <div><p className="kicker">Generation queue</p><h2>Review your neighbourhood content</h2></div>
              {running && <button className="ghost-button danger" onClick={stopGeneration}><X size={16} /> Stop queue</button>}
            </div>
            {running && <div className="progress-card"><LoaderCircle className="spin" size={20} /><div><strong>Generating {completed + 1} of {validRows.length} rows</strong><span>Two rows are processed at a time. You can review completed content below.</span></div><div className="progress-track"><span style={{ width: `${Math.max(4, completed / validRows.length * 100)}%` }} /></div></div>}
            {!validRows.length && <EmptyReview onBack={() => setActiveTab("setup")} />}
            {validRows.map((row) => {
              const status = jobs[row.id] || "queued";
              const rowResults = results[row.id];
              return <article className="result-card" key={row.id}>
                <button className="result-summary" onClick={() => setExpanded((current) => ({ ...current, [row.id]: !current[row.id] }))}>
                  <div className={`status-icon ${status}`}>{status === "done" ? <Check size={16} /> : status === "error" ? <CircleAlert size={16} /> : status === "running" ? <LoaderCircle className="spin" size={16} /> : <span>{splitNeighbourhoods(row.neighbourhoods).length}</span>}</div>
                  <div><h3>{row.city}, {row.country}</h3><p>{row.neighbourhoods}</p></div>
                  <span className={`status-label ${status}`}>{status}</span>
                  {expanded[row.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {expanded[row.id] && Array.isArray(rowResults) && <div className="neighbourhood-grid">
                  {rowResults.map((item, index) => <EditorCard key={`${item.name}-${index}`} item={item} onChange={(patch) => updateResult(row.id, index, patch)} />)}
                </div>}
                {expanded[row.id] && rowResults?.error && <div className="error-box"><CircleAlert size={18} /><span>{rowResults.error}</span><button onClick={() => generateRow(row)}>Try again</button></div>}
              </article>;
            })}
            <div className="review-actions"><button className="ghost-button" onClick={() => setActiveTab("setup")}>Back to places</button><button className="primary-button" onClick={() => setActiveTab("export")} disabled={!Object.values(results).some(Array.isArray)}>Continue to export <ArrowRight size={17} /></button></div>
          </section>
        )}

        {activeTab === "export" && <ExportPanel count={Object.values(results).filter(Array.isArray).length} onExport={exportFile} onBack={() => setActiveTab("review")} />}
      </main>
      <footer><span>Neighbourhood Studio</span><span>Built for clear, consistent travel content</span></footer>
      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}

function EditorCard({ item, onChange }) {
  const [editing, setEditing] = useState(false);
  const paragraphs = item.description.split(/\n\s*\n/).filter(Boolean);

  if (!editing) {
    return <div className="editor-card preview-card">
      <div className="preview-toolbar">
        <span>{item.description.trim().split(/\s+/).length} words</span>
        <button onClick={() => setEditing(true)}>Edit content</button>
      </div>
      <h3>{item.name}</h3>
      <div className="preview-description">
        {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </div>
      <section className="preview-section">
        <h4>Who it’s for</h4>
        <div className="preview-chips">
          {item.whoItsFor.map((tag, index) => <span key={index}>{tag.label}</span>)}
        </div>
      </section>
      <section className="preview-section sights-section">
        <h4>Top sights &amp; experiences</h4>
        <ul>{item.topSights.map((sight, index) => <li key={index}>{sight.label}</li>)}</ul>
      </section>
    </div>;
  }

  return <div className="editor-card edit-card">
    <div className="preview-toolbar"><span>Editing</span><button onClick={() => setEditing(false)}>Done editing</button></div>
    <div className="editor-title"><input value={item.name} onChange={(e) => onChange({ name: e.target.value })} /><span>{item.description.trim().split(/\s+/).length} words</span></div>
    <textarea value={item.description} onChange={(e) => onChange({ description: e.target.value })} />
    <div className="editor-columns">
      <div><label>Who it’s for</label><div className="chips">{item.whoItsFor.map((tag, index) => <input key={index} value={tag.label} onChange={(e) => onChange({ whoItsFor: item.whoItsFor.map((v, i) => i === index ? { label: e.target.value } : v) })} />)}</div></div>
      <div><label>Top sights &amp; experiences</label><ol>{item.topSights.map((sight, index) => <li key={index}><input value={sight.label} onChange={(e) => onChange({ topSights: item.topSights.map((v, i) => i === index ? { label: e.target.value } : v) })} /></li>)}</ol></div>
    </div>
  </div>;
}

function EmptyReview({ onBack }) {
  return <div className="empty-state"><Map size={30} /><h3>No places in the queue</h3><p>Add at least one complete row to start generating.</p><button className="primary-button" onClick={onBack}>Add places</button></div>;
}

function ExportPanel({ count, onExport, onBack }) {
  return <section className="panel export-panel">
    <div className="export-icon"><Download size={25} /></div><p className="kicker">Export</p><h2>Your content is ready to hand off</h2><p>{count} completed city {count === 1 ? "row" : "rows"} will be included. The Excel export matches the original bulk-upload structure and keeps the full JSON in the neighbourhood description column.</p>
    <div className="export-options"><button onClick={() => onExport("xlsx")}><FileSpreadsheet size={22} /><span><strong>Excel workbook</strong><small>Best for the bulk upload workflow</small></span><ArrowRight size={18} /></button><button onClick={() => onExport("csv")}><Download size={22} /><span><strong>CSV file</strong><small>Simple, portable table format</small></span><ArrowRight size={18} /></button></div>
    <button className="ghost-button" onClick={onBack}>Back to review</button>
  </section>;
}

createRoot(document.getElementById("root")).render(<App />);
