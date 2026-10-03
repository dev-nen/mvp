import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listMaintenanceInstitutions } from "@/services/maintenanceAdminService";
import {
  getMunicipalityChoiceById,
  getMunicipalityChoiceLabel,
  searchMunicipalityChoices,
} from "@/services/municipalityService";
import "./MaintenanceCenterCreatePanel.css";

export function MaintenanceCenterCreatePanel({
  formState, onFieldChange, onCreate, isBusy = false, recoveryRequired = false, recoveryMode = "creation",
}) {
  const [institutions, setInstitutions] = useState([]);
  const [referencesReady, setReferencesReady] = useState(false);
  const [referenceError, setReferenceError] = useState("");
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [cityError, setCityError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const name = formState.centerProposalName || "";
  const institutionId = formState.centerProposalInstitutionId || "";
  const institutionName = formState.centerProposalInstitution || "";
  const cityQuery = formState.centerProposalCity || "";
  const cityId = formState.centerProposalCityId || "";
  const address = formState.centerProposalAddress || "";
  const postalCode = formState.centerProposalPostalCode || "";

  useEffect(() => {
    let active = true;
    setReferencesReady(false);
    setReferenceError("");
    void listMaintenanceInstitutions().then((rows) => {
      if (active) {
        setInstitutions(rows ?? []);
        setReferencesReady(true);
      }
    }).catch(() => {
      if (active) setReferenceError("No pudimos cargar las entidades organizadoras. Puedes guardar los datos del borrador y reintentar.");
    });
    return () => { active = false; };
  }, [reloadKey]);

  useEffect(() => {
    let active = true;
    setCities([]);
    setSelectedCity(null);
    setCityError("");
    setIsSearching(true);
    const timer = setTimeout(() => {
      void Promise.all([
        searchMunicipalityChoices(cityQuery),
        cityId ? getMunicipalityChoiceById(cityId) : Promise.resolve(null),
      ]).then(([rows, city]) => {
        if (!active) return;
        setCities(city && !rows.some((row) => String(row.id) === String(city.id)) ? [city, ...rows] : rows);
        setSelectedCity(city);
        if (cityId && !city) setCityError("El municipio guardado no está disponible. Selecciona uno de los resultados.");
      }).catch(() => {
        if (active) setCityError("No pudimos buscar el municipio. Reintenta la búsqueda; los datos escritos se conservan en el borrador al guardarlo.");
      }).finally(() => {
        if (active) setIsSearching(false);
      });
    }, 300);
    return () => { active = false; clearTimeout(timer); };
  }, [cityQuery, cityId, reloadKey]);

  useEffect(() => {
    setConfirmed(false);
    setError("");
  }, [name, institutionId, institutionName, cityQuery, cityId, address, postalCode]);

  const missing = [];
  if (!name.trim()) missing.push("nombre del centro");
  if (institutionId ? !institutions.some((row) => String(row.id) === institutionId) : !institutionName.trim()) {
    missing.push(institutionId ? "entidad organizadora disponible" : "nombre real de la entidad nueva");
  }
  if (!cityId || !selectedCity) missing.push("municipio seleccionado en la lista");
  if (!address.trim()) missing.push("dirección");
  if (!postalCode.trim()) missing.push("código postal");
  if (!confirmed) missing.push("confirmación de los datos y de que no hay duplicados");
  const canCreate = recoveryRequired || (referencesReady && !isSearching && !cityError && missing.length === 0);

  const save = async () => {
    if (!canCreate || isBusy) return;
    setError("");
    try {
      await onCreate({
        name: name.trim(),
        institution_id: institutionId ? Number(institutionId) : null,
        institution_name: institutionId ? null : institutionName.trim(),
        city_id: Number(cityId),
        address_line_1: address.trim(),
        postal_code: postalCode.trim(),
      });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "No pudimos completar el alta. Tus datos siguen en el formulario.");
    }
  };

  return <section className="internal-draft-detail-page__center-notice" aria-labelledby="maintenance-center-heading">
    <h3 id="maintenance-center-heading">Revisar y crear centro</h3>
    <p>Completa la entidad organizadora, el municipio, la dirección y el código postal. Guarda el borrador para conservar tus datos. Crear el centro no publica la actividad.</p>
    <fieldset className="maintenance-center-fields" disabled={isBusy || recoveryRequired}>
      <label htmlFor="maintenance-center-name">Nombre del centro (obligatorio)</label>
      <Input id="maintenance-center-name" maxLength={250} value={name} onChange={(event) => onFieldChange("centerProposalName", event.target.value)} />
      <label htmlFor="maintenance-center-institution">Entidad organizadora</label>
      <select id="maintenance-center-institution" value={institutionId} onChange={(event) => {
        onFieldChange("centerProposalInstitutionId", event.target.value);
        const institution = institutions.find((row) => String(row.id) === event.target.value);
        if (institution) onFieldChange("centerProposalInstitution", institution.name);
      }}>
        <option value="">Crear entidad nueva</option>
        {institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}
      </select>
      {!institutionId ? <>
        <label htmlFor="maintenance-institution-name">Nombre real de la entidad nueva (obligatorio)</label>
        <Input id="maintenance-institution-name" maxLength={250} value={institutionName} onChange={(event) => onFieldChange("centerProposalInstitution", event.target.value)} />
      </> : null}
      <label htmlFor="maintenance-center-city-query">Buscar municipio</label>
      <Input id="maintenance-center-city-query" value={cityQuery} aria-describedby="maintenance-city-help" onChange={(event) => {
        onFieldChange("centerProposalCity", event.target.value);
        onFieldChange("centerProposalCityId", "");
        onFieldChange("centerProposalCityLabel", "");
      }} />
      <small id="maintenance-city-help">Escribe al menos dos letras y selecciona el municipio en la lista de abajo. Escribir su nombre no lo confirma.</small>
      <label htmlFor="maintenance-center-city">Municipio confirmado (obligatorio)</label>
      <select id="maintenance-center-city" value={cityId} disabled={isSearching} onChange={(event) => {
        const city = cities.find((row) => String(row.id) === event.target.value);
        onFieldChange("centerProposalCityId", event.target.value);
        onFieldChange("centerProposalCityLabel", city ? getMunicipalityChoiceLabel(city) : "");
      }}>
        <option value="">Selecciona un municipio</option>
        {cities.map((city) => <option key={String(city.id) + "-" + (city.syntheticKey ?? "")} value={city.id}>{getMunicipalityChoiceLabel(city)}</option>)}
      </select>
      {isSearching ? <small role="status">Buscando municipios…</small> : cityQuery.trim().length >= 2 && !cityError && !cities.length ? <small role="status">No encontramos municipios con ese texto. Prueba otra parte del nombre.</small> : null}
      <label htmlFor="maintenance-center-address">Dirección (obligatoria)</label>
      <Input id="maintenance-center-address" maxLength={500} value={address} onChange={(event) => onFieldChange("centerProposalAddress", event.target.value)} />
      <label htmlFor="maintenance-center-postal">Código postal (obligatorio)</label>
      <Input id="maintenance-center-postal" maxLength={20} value={postalCode} onChange={(event) => onFieldChange("centerProposalPostalCode", event.target.value)} />
      <label><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> He comprobado estos datos y la ausencia de un centro duplicado.</label>
    </fieldset>
    {recoveryRequired ? <p role="status">{recoveryMode === "reload"
      ? "El borrador ha cambiado. Recarga la versión guardada antes de continuar. La recarga sustituirá los cambios del formulario que no se hayan guardado."
      : "La respuesta del alta no se pudo confirmar. Comprueba su resultado antes de editar, guardar o publicar; así evitamos duplicar el centro o perder su vínculo."}</p> : missing.length ? <p id="maintenance-center-missing">Falta completar: {missing.join(", ")}.</p> : null}
    {!referencesReady && !referenceError ? <small role="status">Cargando entidades organizadoras…</small> : null}
    {referenceError || cityError ? <p role="alert">{referenceError || cityError}</p> : null}
    {referenceError || cityError ? <Button variant="outline" disabled={isBusy} onClick={() => setReloadKey((value) => value + 1)}>Reintentar referencias</Button> : null}
    {error ? <p role="alert">{error}</p> : null}
    <Button onClick={save} disabled={!canCreate || isBusy} aria-describedby={!recoveryRequired && missing.length ? "maintenance-center-missing" : undefined}>
      {isBusy ? "Comprobando el centro…" : recoveryRequired ? recoveryMode === "reload" ? "Recargar borrador actualizado" : "Comprobar resultado y continuar" : "Confirmar y crear centro"}
    </Button>
  </section>;
}
