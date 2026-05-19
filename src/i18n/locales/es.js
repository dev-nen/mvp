const es = {
  common: {
    routeLoading: "Cargando NensGo...",
  },
  nav: {
    home: "Inicio",
    activities: "Actividades",
    about: "Sobre NensGo",
    centers: "Para centros",
    joinProject: "Unirme al proyecto",
    joinShort: "Unirme",
    access: "Acceder",
    enter: "Entrar",
    completeProfile: "Completa tu perfil",
    profileCompact: "Perfil",
    verifyEmail: "Verifica tu email",
    emailCompact: "Email",
    activeSession: "Sesión activa. Abrir perfil",
    favorites: "Favoritos",
    profile: "Perfil",
    brandHome: "NensGo - Inicio",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    primaryNavigation: "Navegación principal",
    openSearch: "Buscar",
    closeSearch: "Cerrar búsqueda",
    searchPlaceholder: "Buscar actividades...",
  },
  footer: {
    text:
      "Actividades para peques y familias, organizadas para ayudarte a decidir mejor.",
    contactLabel: "Contacto:",
    legalLinks: [
      { label: "Política de privacidad", to: "/privacidad" },
      { label: "Términos de uso", to: "/terminos" },
    ],
    legalAria: "Enlaces legales",
  },
  home: {
    seoTitle: "NensGo | Actividades para peques y familias cerca de ti",
    seoDescription:
      "Descubre actividades culturales, deportivas, extraescolares y planes en familia cerca de ti. Explora opciones por ciudad, categoría y edad.",
    catalogSrTitle: "Catálogo de actividades",
    catalogLoadErrorTitle: "No pudimos cargar el catálogo",
    retry: "Reintentar",
    emptyTitle: "No encontramos actividades para estos filtros",
    emptyDescription:
      "Prueba a limpiar la búsqueda o ajustar la zona y las categorías.",
    clearFilters: "Limpiar filtros",
  },
  landingHero: {
    eyebrow: "ACTIVIDADES PARA PEQUES Y FAMILIAS",
    title: "Descubre actividades para peques y familias en un solo lugar",
    description:
      "NensGo reúne actividades culturales, deportivas, extraescolares y planes en familia para ayudarte a encontrar opciones cerca de ti sin perder tiempo saltando entre webs, redes y mensajes.",
    cta: "Explorar actividades",
  },
  landingValueProps: {
    eyebrow: "TIPOS DE ACTIVIDADES",
    title: "Qué puedes encontrar",
    description:
      "Una forma más clara de descubrir propuestas para el día a día y para momentos especiales.",
  },
  landingBridge: {
    title: "Empieza a explorar opciones",
    description:
      "Baja al catálogo para ver actividades activas, filtrar por zona o categoría y quedarte con las que mejor encajan con tu familia.",
    cta: "Explorar actividades",
  },
  about: {
    seoTitle: "Qué es NensGo | Actividades para peques y familias",
    seoDescription:
      "Conoce NensGo, una forma sencilla de encontrar actividades, talleres y planes familiares cerca de ti.",
    eyebrow: "Sobre NensGo",
    title: "Qué es NensGo",
    description:
      "Una forma más sencilla de encontrar actividades, talleres y planes familiares cerca de ti.",
    quickAccessItems: [
      {
        id: "extraescolares",
        title: "Extraescolares",
        description:
          "Opciones semanales para deporte, arte y apoyo escolar con un solo acceso rápido.",
        targetCategoryLabels: ["Apoyo escolar", "Arte", "Deportes"],
      },
      {
        id: "talleres-puntuales",
        title: "Talleres y actividades puntuales",
        description:
          "Planes para probar algo nuevo entre semana, fines de semana o vacaciones.",
        targetCategoryLabels: ["Arte", "Cultura", "Familia", "Camps"],
      },
      {
        id: "deportes-movimiento",
        title: "Deportes y movimiento",
        description: "Escuelas y actividades para moverse, jugar y gastar energía.",
        targetCategoryLabels: ["Deportes"],
      },
      {
        id: "cultura-familia",
        title: "Cultura y planes en familia",
        description:
          "Teatro, museos y propuestas culturales para disfrutar juntos.",
        targetCategoryLabels: ["Cultura", "Familia"],
      },
    ],
  },
  support: {
    title: "Soporte",
    description:
      "Estamos terminando este espacio para ayudarte con dudas y gestiones de la cuenta.",
    contactPrefix:
      "Para dudas, sugerencias o incidencias puedes escribirnos a",
    contact:
      "Para dudas, sugerencias o incidencias puedes escribirnos a {email}.",
    backToProfile: "Volver al perfil",
  },
  catalog: {
    toolbar: {
      search: "Buscar",
      area: "Zona",
      categories: "Categorías",
      intro: "Encuentra una actividad por nombre, centro, ciudad o categoría.",
      clear: "Limpiar",
      all: "Todas",
      searchAria: "Buscar por actividad, centro, ciudad o categoría",
      searchPlaceholder: "Buscar por actividad, centro o ciudad",
      categorySelectedOne: "1 seleccionada",
      categorySelectedMany: "{count} seleccionadas",
    },
    card: {
      viewMore: "Ver más",
      fullCard: "Ver ficha completa",
      free: "Gratis",
      addFavorite: "Añadir a favoritos",
      removeFavorite: "Quitar de favoritos",
      share: "Compartir actividad",
      shareTitle: "Actividad en NensGo",
      shareText: "Mira esta actividad en NensGo: {title}",
      allAges: "Para todas las edades",
      ageRange: "{min} a {max} años",
      ageFrom: "Desde {min} años",
      ageUntil: "Hasta {max} años",
      consultAge: "Consulta la edad",
      schedule: "Horario",
      consultSchedule: "Consulta el horario",
      consultPrice: "Consulta el precio",
      consultCenter: "Consulta el centro",
      consultLocation: "Consulta la ubicación",
    },
    detail: {
      back: "Volver",
      close: "Cerrar detalle",
      free: "Gratis",
      addFavorite: "Añadir a favoritos",
      removeFavorite: "Quitar de favoritos",
      showMore: "Ver más",
      showLess: "Ver menos",
      contact: "Contacto",
      loadingContactOptions: "Cargando opciones de contacto.",
      contactOptionsError: "No pudimos cargar el contacto ahora mismo.",
      choosePreferredChannel: "Elige el canal que prefieras.",
      noContactOptions:
        "No hay un canal de contacto publicado en este momento.",
      retryContacts: "Reintentar contactos",
      loadingContact: "Cargando contacto",
      chooseContact: "Elegir contacto",
      contactAction: "Contactar",
      fallbackDescription: "Consulta más información por WhatsApp.",
      ageLabel: "Edad",
      scheduleLabel: "Horario",
      priceLabel: "Precio",
      venueLabel: "Lugar",
      addressLabel: "Dirección",
      centerLabel: "Centro",
      cityLabel: "Ciudad",
    },
    contactOptions: {
      title: "Elige un canal",
      subtitle: "Contacta con {title}",
      close: "Cerrar opciones de contacto",
      back: "Volver",
      form: "Formulario",
      phone: "Llamar",
    },
  },
  auth: {
    feedback: {
      authError:
        "No pudimos completar el acceso ahora mismo. Revisa los datos e inténtalo de nuevo.",
      profileError:
        "No pudimos preparar tu perfil ahora mismo. Inténtalo de nuevo en unos segundos.",
      municipalityError: "No pudimos cargar municipios ahora mismo.",
      savedCityError: "No pudimos cargar la ciudad guardada del perfil.",
      verificationSent:
        "Te enviamos un email de verificación. Revisa tu bandeja de entrada.",
    },
    common: {
      closeAccess: "Cerrar acceso",
      name: "Nombre",
      lastName: "Apellido",
      email: "Correo electrónico",
      password: "Contraseña",
      confirmPassword: "Confirmar contraseña",
      showPassword: "Mostrar contraseña",
      hidePassword: "Ocultar contraseña",
      googleContinue: "Continuar con Google",
      googleConnecting: "Conectando con Google...",
      signIn: "Iniciar sesión",
      createAccount: "Crear cuenta",
    },
    anonymous: {
      welcome: "Bienvenido",
      createTitle: "Crea tu cuenta",
      signInDescription: "Accede con Google o email",
      signUpDescription: "Regístrate con Google o email",
      signInDivider: "o continúa con email",
      signUpDivider: "o crea tu cuenta con email",
      signUpHint:
        "Solo te pediremos la ciudad para guardar tus preferencias.",
      alreadyHaveAccount: "¿Ya tienes cuenta?",
      noAccount: "¿No tienes cuenta?",
      emailPasswordRequired: "Email y contraseña son obligatorios.",
      passwordMismatch: "La confirmación de la contraseña no coincide.",
      creatingAccount: "Creando cuenta...",
      entering: "Entrando...",
    },
    loading: {
      eyebrow: "Preparando acceso",
      title: "Estamos resolviendo tu cuenta",
      description:
        "Estamos leyendo los datos mínimos asociados a tu cuenta autenticada para comprobar si ya podemos continuar.",
    },
    verification: {
      eyebrow: "Verificación requerida",
      title: "Revisa tu email antes de continuar",
      description:
        "La cuenta clásica necesita verificación de email antes de pasar al onboarding obligatorio y al flujo normal de la app.",
      pendingEmail: "Email pendiente:",
      resendMissingEmail:
        "Necesitamos un email para reenviar la verificación.",
      resending: "Reenviando email...",
      resend: "Reenviar verificación",
      alreadyVerified: "Ya verifiqué mi email",
    },
    onboarding: {
      eyebrow: "Onboarding obligatorio",
      title: "Completa tu perfil para continuar",
      description:
        "La cuenta ya está autenticada, pero todavía no tiene el perfil de app listo o le falta la ciudad obligatoria.",
      cityLabel: "Tu ciudad o municipio",
      cityPlaceholder: "Busca tu ciudad o municipio",
      searching: "Buscando municipios...",
      noResults: "No encontramos municipios para esa búsqueda.",
      hint:
        "Empieza a escribir al menos dos letras. También puedes buscar Roquetas o Les Roquetes.",
      nameRequired: "El nombre es obligatorio para completar el perfil.",
      cityRequired:
        "Selecciona una ciudad o municipio para completar el acceso.",
      saving: "Guardando perfil...",
      save: "Guardar y continuar",
    },
    error: {
      eyebrow: "Acceso no listo",
      title: "No pudimos preparar tu acceso",
      description:
        "La autenticación ya existe, pero no hemos podido dejar listo el perfil de aplicación con la configuración actual.",
      retry: "Reintentar",
    },
  },
  protectedRoute: {
    loading: {
      eyebrow: "Acceso",
      title: "Preparando tu acceso",
      description:
        "Estamos comprobando el acceso social y los datos mínimos de la cuenta para esta ruta.",
    },
    verification: {
      eyebrow: "Verificación",
      title: "Falta verificar el email",
      description:
        "Esta ruta necesita una cuenta verificada antes de continuar con el onboarding de perfil.",
      action: "Revisar verificación",
    },
    onboarding: {
      eyebrow: "Onboarding",
      title: "Falta completar tu perfil",
      description:
        "Tu cuenta ya existe, pero todavía falta completar el perfil mínimo obligatorio.",
      action: "Completar perfil",
    },
    error: {
      eyebrow: "Acceso",
      title: "No pudimos cargar tu perfil",
      description:
        "No hemos podido dejar tu acceso listo con la configuración actual.",
      retry: "Reintentar",
      continue: "Continuar acceso",
    },
    anonymous: {
      eyebrow: "Acceso",
      title: "Necesitas acceder para continuar",
      description:
        "Esta pantalla necesita una cuenta identificada y un perfil de app listo para quedar disponible.",
      action: "Acceder",
    },
  },
  profile: {
    loadingLabel: "Preparando tu cuenta",
    loadingTitle: "Ya casi puedes revisar tu cuenta.",
    loadingDescription:
      "Estamos cargando tus datos para mostrarte tu perfil en un momento.",
    back: "Volver",
    title: "Tu cuenta",
    description:
      "Revisa los datos básicos de tu cuenta y cierra sesión cuando lo necesites.",
    identityDescription:
      "Aquí puedes revisar los datos principales asociados a tu cuenta dentro de NensGo.",
    visibleName: "Nombre visible",
    email: "Email",
    city: "Ciudad",
    unavailable: "No disponible",
    noCity: "Sin ciudad asociada",
    authError:
      "No pudimos actualizar la información de tu cuenta ahora mismo.",
    publicationsTitle: "Mis publicaciones",
    publicationsDescription:
      "Consulta el estado de las actividades que enviaste a NensGo.",
    publicationsAction: "Mis publicaciones",
    internalDescription:
      "Si formas parte del equipo, puedes abrir el Draft Inbox desde aquí.",
    internalAction: "Abrir Draft Inbox",
    signingOut: "Cerrando sesión...",
    signOut: "Cerrar sesión",
    anonymousTitle: "Accede para ver tu cuenta",
    anonymousDescription:
      "Entra con Google o con tu email para revisar tus datos y recuperar tus actividades guardadas.",
    openEmailAccess: "Abrir acceso con email",
    returnHint: "Volverás aquí después de completar el acceso.",
  },
  userPublications: {
    back: "Volver al perfil",
    eyebrow: "Publicaciones",
    title: "Mis publicaciones",
    description:
      "Consulta el estado de las actividades que enviaste o editaste para NensGo.",
    loadingEyebrow: "Publicaciones",
    loadingTitle: "Cargando tus publicaciones",
    loadingDescription:
      "Estamos preparando el estado de tus actividades enviadas.",
    errorEyebrow: "Publicaciones",
    loadErrorTitle: "No pudimos cargar tus publicaciones",
    loadErrorDescription: "Inténtalo de nuevo en unos segundos.",
    retry: "Reintentar",
    emptyEyebrow: "Publicaciones",
    emptyTitle: "Todavía no tienes publicaciones enviadas",
    emptyDescription:
      "Todavía no tienes publicaciones enviadas. Cuando envíes o edites una actividad, podrás seguir su estado aquí.",
    status: {
      inReview: "En revisión",
      needsChanges: "Necesita cambios",
      published: "Publicada",
      unpublished: "Despublicada",
      rejected: "No aprobada",
      archived: "Archivada",
    },
    actions: {
      unpublish: "Despublicar",
      unpublishing: "Despublicando...",
      unpublishConfirm:
        "Esta actividad dejará de verse en el catálogo público. Para volver a publicarla necesitará revisión de NensGo.",
      unpublishSuccess: "Actividad despublicada.",
      unpublishError: "No pudimos despublicar esta actividad.",
    },
  },
  favorites: {
    title: "Tus actividades guardadas",
    description:
      "Revisa con más calma las actividades que te interesan y abre su ficha completa cuando quieras decidir con más contexto.",
    loadErrorTitle: "No pudimos cargar tus favoritas",
    noSavedTitle: "Todavía no has guardado actividades",
    noSavedDescription:
      "Usa el corazón en el catálogo para recuperar aquí las opciones que quieras revisar más tarde.",
    backHome: "Volver a Home",
    unavailableTitle: "Tus favoritas ya no están disponibles",
    unavailableDescription:
      "Las actividades que habías guardado ya no se pueden recuperar desde el catálogo actual. Vuelve a explorar para guardar nuevas opciones.",
    explore: "Explorar actividades",
    detailLoadingTitle: "Cargando la ficha",
    detailLoadingDescription:
      "Estamos preparando la información completa de esta actividad.",
    detailLoadErrorTitle: "No pudimos cargar esta actividad",
    activityUnavailableTitle: "Esta actividad ya no está disponible",
    activityUnavailableDescription:
      "La actividad sigue guardada, pero no hemos podido recuperarla desde el catálogo actual.",
    activityNotFoundTitle: "No encontramos esta actividad",
    activityNotFoundDescription:
      "La ficha que intentas abrir no existe en el catálogo actual. Vuelve a favoritos para seguir revisando tus actividades guardadas.",
    noLongerFavoriteTitle: "Esta actividad ya no está en tus favoritos",
    noLongerFavoriteDescription:
      "Vuelve a tu lista para seguir revisando las actividades que todavía tienes guardadas.",
    backToFavorites: "Volver a favoritos",
  },
  paraCentros: {
    seoTitle: "Para centros | Publica tus actividades en NensGo",
    seoDescription:
      "Muestra tus actividades, talleres y propuestas familiares en un entorno pensado para familias.",
    hero: {
      kicker: "¿Ofreces actividades para peques o familias?",
      title: "Haz que tu propuesta llegue mejor a las familias.",
      description:
        "NensGo es una plataforma de actividades infantiles y familiares que quiere reunir en un solo lugar propuestas que hoy están dispersas entre redes, grupos y canales poco claros. Esta página presenta la visión del proyecto, la plataforma que estamos construyendo y la convocatoria abierta para talleres, deporte, arte, cultura y espacios para peques que quieran sumarse desde el principio.",
      points: [
        "Más visibilidad local para actividades de calidad.",
        "Una presentación clara para que las familias entiendan rápido tu propuesta.",
        "Un proceso simple para empezar a formar parte del proyecto.",
      ],
      panelTitle: "Un escaparate digital claro",
      panelDescription:
        "Tu propuesta se muestra de forma simple, visual y fácil de entender.",
      featureItems: [
        "Tipo de actividad y edades recomendadas.",
        "Ubicación, horarios y zona de trabajo.",
        "Descripción breve y visual de la propuesta.",
        "Imágenes y forma de contacto.",
      ],
    },
    story: {
      kicker: "Nuestra historia",
      title: "Así nació NensGo",
      description:
        "NensGo nace de una necesidad muy concreta: encontrar actividades bien explicadas, cercanas y distintas a las de siempre.",
      intro: [
        "Somos una familia a la que le encanta hacer planes. Siempre estamos buscando nuevas actividades, propuestas diferentes y experiencias que nos permitan descubrir cosas, compartir tiempo de calidad y, sobre todo, regalarle a nuestro hijo oportunidades para aprender, disfrutar y vivir algo nuevo.",
      ],
      challenge: [
        "Con el tiempo fuimos notando algo que seguramente le pasa a muchas familias: encontrar actividades interesantes no siempre es fácil.",
        "Muchas veces la información está dispersa, incompleta o cuesta muchísimo llegar a propuestas distintas a las de siempre.",
      ],
      calloutEyebrow: "Lo empezamos a oír una y otra vez",
      promptIntro:
        "También nos pasó que, casi sin querer, empezamos a convertirnos en una especie de referencia para otras familias.",
      prompts: [
        '"Ustedes que siempre están haciendo cosas... ¿qué nos recomendáis?"',
        '"¿Tenéis alguna idea para este finde?"',
        '"¿Dónde encontrasteis esa actividad?"',
      ],
      bridge:
        "Y así, entre mensajes, recomendaciones y enlaces compartidos, vimos una necesidad muy clara: ¿por qué no crear un sitio donde todo esto pueda encontrarse de forma más fácil y ordenada?",
      closing: [
        "Por eso NensGo nace con una idea muy simple: ayudar a las familias a descubrir actividades cerca de ellas, dar visibilidad a pequeños proyectos, talleres, espacios y propuestas locales, y reunir en un solo lugar opciones para disfrutar con hijos y en familia.",
        'Queremos facilitar la búsqueda, inspirar nuevos planes y hacer que encontrar algo para hacer no dependa de tener "el contacto correcto" o de que justo alguien te pase la información.',
        "Porque creemos que hay muchísimo por descubrir, y que compartirlo también es una forma de construir comunidad.",
      ],
      summaryEyebrow: "Lo que queremos construir",
      summaryTitle: "Un lugar más claro para descubrir planes en familia",
      missionPoints: [
        "Ayudar a las familias a descubrir actividades cerca de ellas.",
        "Dar visibilidad a pequeños proyectos, talleres, espacios y propuestas locales.",
        "Reunir en un solo lugar opciones para disfrutar con hijos y en familia.",
      ],
    },
    idea: {
      kicker: "La idea base",
      title: "Una forma clara, moderna y práctica de descubrir actividades",
      description:
        "Cada propuesta se presenta en una ficha visual y ordenada para que una familia entienda rápido si encaja con lo que está buscando.",
      paragraphs: [
        "NensGo quiere ser ese lugar donde descubrir planes resulte sencillo: una experiencia pensada para ver en pocos segundos qué es cada actividad, para qué edades está pensada y dónde encontrarla.",
        "La ficha que ves aquí resume esa idea: una propuesta bien presentada, con la información importante a la vista y una estructura que ayuda a decidir sin tener que rebuscar entre mensajes, redes o enlaces sueltos.",
        "Buscamos una solución moderna, organizativa y práctica: un espacio cuidado para las familias y, al mismo tiempo, una forma clara de mostrar cada proyecto con orden, contexto y utilidad real.",
      ],
      previewEyebrow: "Así se verá una actividad",
    },
    activityExample: {
      category: "Arte",
      title: "Taller de pintura creativa",
      ages: "7 a 12 años",
      center: "Espai Creatiu Ribes",
      locality: "Sant Pere de Ribes",
      cta: "Ver más",
      imageAlt: "Tres niños pintando en un caballete, vistos de espaldas.",
    },
    preview: {
      description:
        "Sesiones creativas para peques que quieren experimentar con color, composición y materiales en un entorno guiado y cercano.",
      schedule: "Martes y jueves, 17:30 a 19:00",
      price: "Desde 42 EUR al mes",
      venue: "Espai Creatiu Ribes",
      address: "Carrer de la Pintura, 12",
      city: "Sant Pere de Ribes",
      contactTitle: "Contactar",
      contactCopy:
        "Habla directamente con el centro para pedir más información.",
      contactCta: "Contactar",
      back: "Volver",
      close: "Cerrar vista previa",
      age: "Edad",
      scheduleLabel: "Horario",
      priceLabel: "Precio",
      center: "Centro",
      addressLabel: "Dirección",
      cityLabel: "Ciudad",
    },
    benefits: {
      kicker: "¿Qué gana tu proyecto?",
      title: "Más visibilidad, más claridad y más oportunidades de contacto",
      description:
        "NensGo está pensado para que proyectos reales ganen presencia sin perder tiempo en una web compleja.",
      items: [
        {
          title: "Más visibilidad",
          description:
            "Tu actividad aparece en un espacio centrado en planes y servicios para peques y familias.",
        },
        {
          title: "Más claridad",
          description:
            "La propuesta se presenta de forma ordenada para que una familia entienda rápido si encaja.",
        },
        {
          title: "Más oportunidades de contacto",
          description:
            "Facilitamos que nuevos interesados descubran tu actividad y quieran saber más.",
        },
      ],
      futureTitle: "Más adelante",
      futureText:
        "También queremos compartir señales útiles para ayudarte a entender mejor el interés que genera tu actividad:",
      futureSignals: [
        "Qué tipos de actividades despiertan más interés.",
        "Qué zonas concentran más búsquedas.",
        "Qué fichas generan más clics o contactos.",
      ],
    },
    audience: {
      kicker: "¿A quién va dirigido?",
      title: "A centros, actividades y proyectos pensados para peques y familias",
      description:
        "Si tu propuesta aporta valor a familias y niños, nos interesa conocerla.",
      items: [
        "Academias y centros formativos.",
        "Actividades extraescolares y deportivas.",
        "Talleres artísticos, creativos y culturales.",
        "Espacios familiares, casales y propuestas de temporada.",
        "Profesionales o entidades que trabajen con peques y familias.",
      ],
    },
    requiredInfo: {
      kicker: "¿Qué necesitamos de ti?",
      title: "Solo unos pocos datos para valorar tu propuesta",
      description:
        "Solo pedimos una primera información básica para entender el proyecto y poder hablar contigo.",
      items: [
        "Quién eres o qué entidad representas.",
        "Qué actividad o servicio ofreces.",
        "En qué zona trabajas.",
        "Para qué edades está pensada tu propuesta.",
        "Una forma de contacto.",
      ],
    },
    product: {
      kicker: "¿Qué tipo de espacio queremos crear?",
      title: "Un espacio útil, cuidado y de valor real",
      description:
        "NensGo no quiere ser un listado sin criterio. Queremos crear un espacio donde las familias encuentren propuestas confiables y donde quienes organizan actividades puedan mostrarse de forma clara.",
      text:
        "Por eso nos interesa contar con proyectos reales, bien explicados y con ganas de formar parte de una plataforma pensada para conectar mejor la oferta con la demanda.",
      imageAlt:
        "Vista previa de la aplicación NensGo con buscador, filtros y tarjetas de actividades.",
      caption:
        "Vista real de la aplicación que guiará a las familias a descubrir actividades de forma más clara.",
    },
    cta: {
      kicker: "¿Quieres unirte al proyecto?",
      title: "Tu actividad puede formar parte de NensGo.",
      text: "Déjanos tus datos en el formulario y te contactaremos si así lo deseas.",
      contactNote: "También puedes escribirnos directamente a",
      action: "Quiero participar",
    },
  },
};

export default es;
