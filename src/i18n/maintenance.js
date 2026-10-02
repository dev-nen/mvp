// Maintenance copy overrides legacy feature dictionaries; dynamic catalog values
// are never translated here.
export const maintenanceDictionaries = {
  es: {
    nav: { about: "Conócenos" },
    home: {
      seoDescription: "Descubre actividades culturales, deportivas, extraescolares y planes en familia. Explora por categoría y contacta directamente con el centro.",
      catalogLoadErrorDescription: "Inténtalo de nuevo dentro de unos minutos.",
      emptyTitle: "No hay actividades en esta categoría",
      emptyDescription: "Elige otra categoría o consulta todas las actividades.",
      clearFilters: "Ver todas las actividades",
    },
    landingHero: { description: "Deporte, arte, talleres y planes en familia. Descubre propuestas, consulta sus detalles y habla directamente con el centro." },
    landingBridge: { description: "Explora las actividades por categoría y encuentra una propuesta para compartir, aprender o probar algo nuevo." },
    about: {
      title: "Conócenos",
      description: "NensGo reúne actividades para peques y familias en un catálogo sencillo y abierto.",
      letterTitle: "Un lugar para descubrir juntos",
      paragraphs: [
        "Encontrar una actividad suele empezar con un cartel, una recomendación o un enlace. NensGo nace para reunir esas propuestas y hacer que sea más fácil conocerlas.",
        "Aquí encontrarás deporte, arte, talleres, cultura y planes en familia. Cada ficha reúne la información disponible sobre edades, horarios, ubicación y precio, junto con los canales de contacto del centro.",
        "Puedes explorar y consultar las actividades sin crear una cuenta. NensGo facilita el descubrimiento; las reservas y las consultas se realizan directamente con quienes organizan cada propuesta.",
        "El catálogo se actualiza de forma manual y periódica. Confirma siempre con el centro las fechas, plazas y condiciones antes de asistir.",
      ],
    },
    catalog: {
      categories: { label: "Categorías de actividades", all: "Todas" },
      detail: { requesterNameLabel: "Tu nombre (opcional)", requesterNamePlaceholder: "¿Cómo te llamas?", requesterNameHint: "Solo se añadirá al mensaje. No lo guardamos." },
      contactOptions: { subtitle: "Elige un método para contactar con el centro." },
    },
    maintenance: { navigation: "Administración", drafts: "Borradores", activities: "Actividades", import: "Importar JSON", signOut: "Cerrar sesión", backToSite: "Ver web", signOutError: "No pudimos cerrar la sesión. Inténtalo de nuevo." },
    backup: {
      title: "Respaldo público", description: "Después de publicar, modificar o retirar actividades, crea una copia actualizada del catálogo, las imágenes y los contactos.",
      lastReady: "Último respaldo: {date} · {count} actividades.", noConfirmedBackup: "Todavía no hay un respaldo público confirmado.",
      productionOnly: "El respaldo se crea desde la administración de nensgo.com.", requesting: "Solicitando respaldo…", pending: "Preparando la copia. Estamos esperando a que se publique.", ready: "Respaldo publicado y comprobado.", create: "Crear respaldo público",
      signInRequired: "Inicia sesión para crear el respaldo.", operatorRequired: "Esta acción requiere acceso de administración.", notConfigured: "Falta configurar el respaldo. Consulta la guía de mantenimiento.", requestFailed: "No pudimos solicitar el respaldo. Inténtalo de nuevo.", notConfirmed: "No hemos podido confirmar la nueva copia. Se conserva el último respaldo; comprueba el despliegue antes de reintentarlo.",
    },
  },
  ca: {
    nav: { about: "Coneix-nos" },
    home: {
      seoDescription: "Descobreix activitats culturals, esportives, extraescolars i plans en família. Explora per categoria i contacta directament amb el centre.",
      catalogLoadErrorDescription: "Torna-ho a provar d’aquí a uns minuts.", emptyTitle: "No hi ha activitats en aquesta categoria", emptyDescription: "Tria una altra categoria o consulta totes les activitats.", clearFilters: "Veure totes les activitats",
    },
    landingHero: { description: "Esport, art, tallers i plans en família. Descobreix propostes, consulta’n els detalls i parla directament amb el centre." },
    landingBridge: { description: "Explora les activitats per categoria i troba una proposta per compartir, aprendre o provar alguna cosa nova." },
    about: {
      title: "Coneix-nos", description: "NensGo reuneix activitats per a infants i famílies en un catàleg senzill i obert.", letterTitle: "Un lloc per descobrir plegats",
      paragraphs: [
        "Trobar una activitat sovint comença amb un cartell, una recomanació o un enllaç. NensGo neix per reunir aquestes propostes i facilitar-ne la descoberta.",
        "Hi trobaràs esport, art, tallers, cultura i plans en família. Cada fitxa reuneix la informació disponible sobre edats, horaris, ubicació i preu, juntament amb els canals de contacte del centre.",
        "Pots explorar i consultar les activitats sense crear un compte. NensGo facilita la descoberta; les reserves i les consultes es fan directament amb qui organitza cada proposta.",
        "El catàleg s’actualitza manualment i periòdicament. Confirma sempre amb el centre les dates, les places i les condicions abans d’assistir-hi.",
      ],
    },
    catalog: { categories: { label: "Categories d’activitats", all: "Totes" }, detail: { requesterNameLabel: "El teu nom (opcional)", requesterNamePlaceholder: "Com et dius?", requesterNameHint: "Només s’afegirà al missatge. No el guardem." }, contactOptions: { subtitle: "Tria un mètode per contactar amb el centre." } },
    maintenance: { navigation: "Administració", drafts: "Esborranys", activities: "Activitats", import: "Importar JSON", signOut: "Tancar sessió", backToSite: "Veure el web", signOutError: "No hem pogut tancar la sessió. Torna-ho a provar." },
    backup: {
      title: "Còpia pública", description: "Després de publicar, modificar o retirar activitats, crea una còpia actualitzada del catàleg, les imatges i els contactes.", lastReady: "Última còpia: {date} · {count} activitats.", noConfirmedBackup: "Encara no hi ha cap còpia pública confirmada.", productionOnly: "La còpia es crea des de l’administració de nensgo.com.", requesting: "Sol·licitant la còpia…", pending: "Preparant la còpia. Esperem que es publiqui.", ready: "Còpia publicada i comprovada.", create: "Crear còpia pública", signInRequired: "Inicia sessió per crear la còpia.", operatorRequired: "Aquesta acció requereix accés d’administració.", notConfigured: "Falta configurar la còpia. Consulta la guia de manteniment.", requestFailed: "No hem pogut sol·licitar la còpia. Torna-ho a provar.", notConfirmed: "No hem pogut confirmar la nova còpia. Es conserva l’última; comprova el desplegament abans de tornar-ho a provar.",
    },
  },
  en: {
    nav: { about: "About us" },
    home: { seoDescription: "Discover cultural activities, sports, after-school activities and family outings. Browse by category and contact the centre directly.", catalogLoadErrorDescription: "Please try again in a few minutes.", emptyTitle: "There are no activities in this category", emptyDescription: "Choose another category or browse all activities.", clearFilters: "View all activities" },
    landingHero: { description: "Sports, art, workshops and family outings. Discover activities, read the details and speak directly with the centre." },
    landingBridge: { description: "Browse activities by category and find something to share, learn or try for the first time." },
    about: {
      title: "About us", description: "NensGo brings children’s and family activities together in a simple, open catalogue.", letterTitle: "A place to discover together",
      paragraphs: [
        "Finding an activity often starts with a poster, a recommendation or a link. NensGo brings these suggestions together to make them easier to discover.",
        "You will find sports, art, workshops, culture and family outings. Each page brings together the available information about ages, times, location and price, alongside the centre’s contact details.",
        "You can browse and read about activities without an account. NensGo helps you discover them; bookings and enquiries go directly to the organisers.",
        "The catalogue is updated manually from time to time. Always confirm dates, availability and conditions with the centre before attending.",
      ],
    },
    catalog: { categories: { label: "Activity categories", all: "All" }, detail: { requesterNameLabel: "Your name (optional)", requesterNamePlaceholder: "What is your name?", requesterNameHint: "It will only be added to the message. We do not save it." }, contactOptions: { subtitle: "Choose how to contact the centre." } },
    maintenance: { navigation: "Administration", drafts: "Drafts", activities: "Activities", import: "Import JSON", signOut: "Sign out", backToSite: "View website", signOutError: "We could not sign you out. Please try again." },
    backup: {
      title: "Public backup", description: "After publishing, changing or withdrawing activities, create an updated copy of the catalogue, images and contact details.", lastReady: "Last backup: {date} · {count} activities.", noConfirmedBackup: "There is no confirmed public backup yet.", productionOnly: "Create the backup from the administration area on nensgo.com.", requesting: "Requesting backup…", pending: "Preparing the copy. Waiting for it to be published.", ready: "Backup published and verified.", create: "Create public backup", signInRequired: "Sign in to create the backup.", operatorRequired: "This action requires administrator access.", notConfigured: "The backup needs to be configured. See the maintenance guide.", requestFailed: "We could not request the backup. Please try again.", notConfirmed: "We could not confirm the new copy. The last backup is retained; check the deployment before trying again.",
    },
  },
};

export function mergeMaintenanceCopy(base, overrides) {
  const result = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    result[key] = value && typeof value === "object" && !Array.isArray(value)
      ? mergeMaintenanceCopy(base[key] ?? {}, value) : value;
  }
  return result;
}
