import { useEffect, useRef, useState } from "react";
import { Archive, CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/useI18n";
import { getSupabaseClient } from "@/services/supabaseClient";
import { readPublicBackupManifest } from "@/services/publicCatalogBackupService";
import "./CatalogBackupPanel.css";

const POLL_INTERVAL_MS = 10_000;
const MAX_WAIT_MS = 10 * 60_000;
const ERROR_KEYS = {
  sign_in_required: "backup.signInRequired",
  operator_required: "backup.operatorRequired",
  production_only: "backup.productionOnly",
  backup_not_configured: "backup.notConfigured",
  backup_request_failed: "backup.requestFailed",
};

export function CatalogBackupPanel() {
  const { t, language } = useI18n();
  const [manifest, setManifest] = useState(null);
  const [state, setState] = useState("idle");
  const [errorKey, setErrorKey] = useState("");
  const [pending, setPending] = useState(null);
  const mounted = useRef(true);
  const isProductionSite = typeof window !== "undefined" &&
    ["nensgo.com", "www.nensgo.com"].includes(window.location.hostname);

  useEffect(() => {
    mounted.current = true;
    readPublicBackupManifest().then((value) => {
      if (mounted.current) setManifest(value);
    }).catch(() => { /* An initial deployment may not have a backup yet. */ });
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!pending) return undefined;
    let cancelled = false;
    let timer;
    const poll = async () => {
      try {
        const next = await readPublicBackupManifest();
        if (cancelled) return;
        if (next.generationId !== pending.previousGeneration &&
          Date.parse(next.generatedAt) >= Date.parse(pending.requestedAt)) {
          setManifest(next);
          setState("ready");
          setPending(null);
          return;
        }
      } catch { /* Continue checking the actual published copy after temporary network errors. */ }
      if (cancelled) return;
      if (Date.now() - pending.startedAt >= MAX_WAIT_MS) {
        setState("error");
        setErrorKey("backup.notConfirmed");
        setPending(null);
        return;
      }
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };
    timer = setTimeout(poll, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [pending]);

  async function createBackup() {
    if (!isProductionSite || state === "requesting" || state === "pending") return;
    setErrorKey("");
    setState("requesting");
    try {
      const { data, error } = await getSupabaseClient().auth.getSession();
      if (error || !data.session?.access_token) throw new Error("backup.signInRequired");
      const response = await fetch("/api/internal/catalog-backup", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        signal: AbortSignal.timeout(25_000),
      });
      const result = await response.json();
      if (!response.ok || result.state !== "pending" || !Number.isFinite(Date.parse(result.requestedAt))) {
        throw new Error(ERROR_KEYS[result.error] || "backup.requestFailed");
      }
      if (!mounted.current) return;
      setPending({ requestedAt: result.requestedAt, previousGeneration: manifest?.generationId, startedAt: Date.now() });
      setState("pending");
    } catch (error) {
      if (!mounted.current) return;
      setState("error");
      const message = error instanceof Error ? error.message : "";
      setErrorKey(Object.values(ERROR_KEYS).includes(message) ? message : "backup.requestFailed");
    }
  }

  const dateLabel = manifest ? new Intl.DateTimeFormat(
    { es: "es-ES", ca: "ca-ES", en: "en-GB" }[language],
    { dateStyle: "medium", timeStyle: "short" },
  ).format(new Date(manifest.generatedAt)) : "";
  const busy = state === "requesting" || state === "pending";

  return (
    <section className="catalog-backup-panel" aria-labelledby="catalog-backup-title">
      <div className="catalog-backup-panel__copy">
        <h2 id="catalog-backup-title"><Archive size={18} aria-hidden="true" />{t("backup.title")}</h2>
        <p>{t("backup.description")}</p>
        <p className="catalog-backup-panel__last">{manifest
          ? t("backup.lastReady", { date: dateLabel, count: manifest.activityCount })
          : t("backup.noConfirmedBackup")}</p>
        {!isProductionSite && <p>{t("backup.productionOnly")}</p>}
        <div aria-live="polite" role="status">
          {busy && <p className="catalog-backup-panel__status"><LoaderCircle size={16} className="catalog-backup-panel__spinner" aria-hidden="true" />{t(state === "requesting" ? "backup.requesting" : "backup.pending")}</p>}
          {state === "ready" && <p className="catalog-backup-panel__status"><CheckCircle2 size={16} aria-hidden="true" />{t("backup.ready")}</p>}
          {errorKey && <p className="catalog-backup-panel__error">{t(errorKey)}</p>}
        </div>
      </div>
      <Button type="button" onClick={createBackup} disabled={!isProductionSite || busy}>
        {t("backup.create")}
      </Button>
    </section>
  );
}
