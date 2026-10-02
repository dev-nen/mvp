import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { buildMaintenanceImportPrompt, getMaintenanceImportBatchKey, MAINTENANCE_IMPORT_EXAMPLE, parseMaintenanceJsonImport } from "@/helpers/maintenanceJsonImport";
import { listDraftCategories, listDraftCenters, listDraftTypes } from "@/services/internalDraftsService";
import { importMaintenanceDrafts } from "@/services/maintenanceAdminService";
import "./InternalJsonImportPage.css";

export function InternalJsonImportPage() {
  const [rawText, setRawText] = useState("");
  const [references, setReferences] = useState(null);
  const [preview, setPreview] = useState([]);
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  useEffect(() => {
    let active = true;
    setReferences(null);
    setError("");
    void Promise.all([listDraftCenters(), listDraftCategories(), listDraftTypes()]).then(([centers, categories, types]) => {
      if (active) setReferences({ centers, categories, types });
    }).catch(() => { if (active) setError("No pudimos cargar las referencias del catálogo. Reintenta antes de importar."); });
    return () => { active = false; };
  }, [loadKey]);
  const prompt = useMemo(() => buildMaintenanceImportPrompt(references ?? {}), [references]);
  const changeText = (nextText) => { setRawText(nextText); setPreview([]); setSavedDrafts([]); setError(""); };
  const review = () => {
    setError(""); setSavedDrafts([]);
    try { setPreview(parseMaintenanceJsonImport(rawText, references)); } catch (failure) { setPreview([]); setError(failure.message); }
  };
  const upload = async (file) => {
    if (!file) return;
    if (file.size > 1024 * 1024) { setError("El archivo no puede superar 1 MB."); return; }
    try { changeText(await file.text()); } catch { setError("No pudimos leer el archivo."); }
  };
  const save = async () => {
    if (!preview.length || isSaving || savedDrafts.length) return;
    setIsSaving(true); setError("");
    try { setSavedDrafts(await importMaintenanceDrafts(await getMaintenanceImportBatchKey(preview), preview)); }
    catch (failure) { setError(failure.message); }
    finally { setIsSaving(false); }
  };
  return <main className="internal-json-import page-container">
    <header><h1>Importar actividades</h1><p>Prepara el JSON, comprueba los datos y guarda borradores. Cada actividad se revisa y aprueba antes de publicarse.</p></header>
    <nav aria-label="Herramientas del catálogo"><Link to="/internal/drafts">Borradores</Link><Link to="/internal/activities">Actividades</Link><Link to="/internal/drafts/new">Crear manualmente</Link></nav>
    <details><summary>Prompt y ejemplo para preparar el JSON</summary><p>Usa una herramienta externa con los carteles o fuentes. No hay ninguna llamada de IA desde NensGo.</p><label htmlFor="import-prompt">Prompt</label><textarea id="import-prompt" readOnly value={prompt} rows={12} /><pre>{JSON.stringify(MAINTENANCE_IMPORT_EXAMPLE, null, 2)}</pre></details>
    {error ? <p role="alert" className="internal-json-import__error">{error}</p> : null}
    {!references ? <p role="status">{error ? <Button variant="outline" onClick={() => setLoadKey((value) => value + 1)}>Reintentar referencias</Button> : "Cargando centros, categorías y tipos…"}</p> : null}
    <label htmlFor="import-file">Cargar archivo JSON</label><input id="import-file" type="file" accept="application/json,.json" disabled={isSaving} onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
    <label htmlFor="import-json">O pegar JSON</label><textarea id="import-json" value={rawText} onChange={(event) => changeText(event.target.value)} rows={14} spellCheck={false} disabled={isSaving} />
    <Button disabled={!references || !rawText.trim() || isSaving} onClick={review}>Revisar importación</Button>
    {preview.length ? <section aria-label="Revisión de importación"><h2>{preview.length} actividades para revisar</h2><p>Las propuestas y los datos pendientes se conservan en cada borrador. No se completan automáticamente.</p>{preview.map((item, index) => <article key={index}><h3>{item.payload.activity.title || `Actividad ${index + 1} sin título`}</h3><p>{item.payload.center.name || references.centers.find((center) => center.id === item.payload.activity.center_id)?.label || "Centro pendiente"}</p>{item.warnings.length ? <ul>{item.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : <p>Revisa igualmente todos los datos antes de aprobar.</p>}{item.payload.import_review.notes ? <p>{item.payload.import_review.notes}</p> : null}</article>)}<Button onClick={save} disabled={isSaving || savedDrafts.length > 0}>{isSaving ? "Guardando borradores…" : savedDrafts.length ? "Lote guardado" : "Guardar como borradores"}</Button></section> : null}
    {savedDrafts.length ? <section role="status"><h2>Importación guardada</h2><p>Ninguna actividad se ha publicado. Abre cada borrador para revisar, añadir su imagen y aprobar.</p><ul>{savedDrafts.map((draft) => <li key={draft.draft_id}><Link to={`/internal/drafts/${draft.draft_id}`}>{draft.title || "Revisar actividad"}</Link></li>)}</ul><p>Después de publicar el lote, usa «Crear respaldo público».</p></section> : null}
  </main>;
}
