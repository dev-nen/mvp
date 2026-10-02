import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createMaintenanceCenter, listMaintenanceInstitutions } from "@/services/maintenanceAdminService";
import { getMunicipalityChoiceLabel, searchMunicipalityChoices } from "@/services/municipalityService";

export function MaintenanceCenterCreatePanel({ draftId, formState, onBeforeCreate, onCreated }) {
  const [institutions, setInstitutions] = useState([]);
  const [institutionId, setInstitutionId] = useState("");
  const [institutionName, setInstitutionName] = useState(formState.centerProposalInstitution || "");
  const [name, setName] = useState(formState.centerProposalName || "");
  const [cityQuery, setCityQuery] = useState(formState.centerProposalCity || "");
  const [cities, setCities] = useState([]);
  const [cityId, setCityId] = useState("");
  const [address, setAddress] = useState(formState.centerProposalAddress || "");
  const [postalCode, setPostalCode] = useState(formState.centerProposalPostalCode || "");
  const [confirmed, setConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [referencesReady, setReferencesReady] = useState(false);
  useEffect(() => {
    let active = true;
    setReferencesReady(false); setError("");
    void listMaintenanceInstitutions().then((rows) => { if (active) { setInstitutions(rows ?? []); setReferencesReady(true); } }).catch((failure) => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [reloadKey]);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      void searchMunicipalityChoices(cityQuery).then((rows) => { if (active) setCities(rows); }).catch(() => { if (active) { setCities([]); setError("No pudimos buscar el municipio."); } });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [cityQuery]);
  const save = async () => {
    if (!confirmed || isSaving || !referencesReady) return;
    if (!name.trim() || !cityId || !address.trim() || !postalCode.trim() || (!institutionId && !institutionName.trim())) {
      setError("Completa nombre, entidad organizadora, municipio, dirección y código postal."); return;
    }
    setIsSaving(true); setError("");
    try {
      await onBeforeCreate();
      await createMaintenanceCenter({ draft_id: Number(draftId), name: name.trim(), institution_id: institutionId ? Number(institutionId) : null,
        institution_name: institutionId ? null : institutionName.trim(), city_id: Number(cityId), address_line_1: address.trim(), postal_code: postalCode.trim() });
      await onCreated();
    } catch (failure) { setError(failure.message); }
    finally { setIsSaving(false); }
  };
  return <fieldset className="internal-draft-detail-page__center-notice" disabled={isSaving}>
    <legend>Revisar y crear centro</legend>
    <p>El centro necesita una entidad organizadora, municipio y dirección confirmados. Su alta no publica la actividad.</p>
    <label htmlFor="maintenance-center-name">Nombre del centro</label><Input id="maintenance-center-name" value={name} onChange={(event) => setName(event.target.value)} />
    <label htmlFor="maintenance-center-institution">Entidad organizadora</label><select id="maintenance-center-institution" value={institutionId} onChange={(event) => setInstitutionId(event.target.value)}><option value="">Crear entidad nueva</option>{institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}</select>
    {!institutionId ? <><label htmlFor="maintenance-institution-name">Nombre real de la entidad nueva</label><Input id="maintenance-institution-name" value={institutionName} onChange={(event) => setInstitutionName(event.target.value)} /></> : null}
    <label htmlFor="maintenance-center-city-query">Buscar municipio</label><Input id="maintenance-center-city-query" value={cityQuery} onChange={(event) => { setCityQuery(event.target.value); setCityId(""); }} />
    <label htmlFor="maintenance-center-city">Municipio confirmado</label><select id="maintenance-center-city" value={cityId} onChange={(event) => setCityId(event.target.value)}><option value="">Selecciona un municipio</option>{cities.map((city) => <option key={`${city.id}-${city.syntheticKey ?? ""}`} value={city.id}>{getMunicipalityChoiceLabel(city)}</option>)}</select>
    <label htmlFor="maintenance-center-address">Dirección</label><Input id="maintenance-center-address" value={address} onChange={(event) => setAddress(event.target.value)} />
    <label htmlFor="maintenance-center-postal">Código postal</label><Input id="maintenance-center-postal" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} />
    <label><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> He comprobado estos datos y la ausencia de un centro duplicado.</label>
    {error ? <p role="alert">{error}</p> : null}
    {!referencesReady && error ? <Button variant="outline" onClick={() => setReloadKey((value) => value + 1)}>Reintentar entidades</Button> : null}
    <Button onClick={save} disabled={!confirmed || isSaving || !referencesReady}>{isSaving ? "Creando centro…" : "Confirmar y crear centro"}</Button>
  </fieldset>;
}
