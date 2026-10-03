import { getSupabaseClient } from "@/services/supabaseClient";

async function rpc(name, args, errorMessage) {
  const client = getSupabaseClient();
  if (!client) throw new Error(errorMessage);
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(errorMessage);
  return data;
}

export function importMaintenanceDrafts(batchKey, items) {
  return rpc("import_maintenance_drafts", {
    p_batch_key: batchKey,
    p_items: items.map((item) => ({ payload: item.payload, source_label: item.sourceLabel, source_reference_url: item.sourceUrl })),
  }, "No pudimos guardar la importación. No se publicó ninguna actividad; puedes reintentar el mismo lote sin duplicarlo.");
}

export function listMaintenanceInstitutions() {
  return rpc("list_maintenance_institutions", {}, "No pudimos cargar las entidades organizadoras.");
}

export async function createMaintenanceCenter(payload) {
  const client = getSupabaseClient();
  if (!client) throw new Error("No pudimos conectar para crear el centro.");
  const { data, error } = await client.rpc("create_maintenance_center", { p_payload: payload });
  if (!error) return data;
  const messages = {
    "a center with this name and city already exists": "Ya existe un centro con ese nombre y municipio. Selecciónalo en Centro existente; no vuelvas a darlo de alta.",
    "institution already exists; select it explicitly": "La entidad organizadora ya existe. Selecciónala en la lista en lugar de crear una entidad nueva.",
    "confirmed center name, address, postcode, city and draft are required": "Completa el nombre del centro, el municipio seleccionado, la dirección y el código postal.",
    "confirmed institution name is required": "Selecciona una entidad organizadora o completa el nombre real de la entidad nueva.",
    "valid institution is required": "La entidad organizadora ya no está disponible. Revisa la selección.",
    "valid city is required": "El municipio ya no está disponible. Revisa la selección.",
    "pending draft is required": "El borrador ya no está pendiente de revisión. Recárgalo antes de continuar.",
    "center values are too long": "Revisa la longitud del nombre, la entidad, la dirección y el código postal.",
  };
  const message = error.code === "42501" ? "Esta cuenta no tiene permiso para crear centros." : messages[error.message];
  const failure = new Error(message || "No pudimos dar de alta el centro. Los datos siguen guardados en el borrador; revisa los campos y reintenta.");
  failure.isUserFacing = true;
  failure.creationRejected = error.code === "42501" || (error.code === "P0001" && Object.hasOwn(messages, error.message));
  throw failure;
}
