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

export function createMaintenanceCenter(payload) {
  return rpc("create_maintenance_center", { p_payload: payload }, "No pudimos dar de alta el centro. Revisa los datos obligatorios, los posibles duplicados y la configuración de administración.");
}
