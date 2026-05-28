const ca = {
  common: {
    routeLoading: "Carregant NensGo...",
  },
  nav: {
    home: "Inici",
    activities: "Activitats",
    about: "Coneix-nos",
    centers: "Per a centres",
    joinProject: "Unir-me al projecte",
    joinShort: "Unir-me",
    access: "Accedir",
    enter: "Entrar",
    completeProfile: "Completa el perfil",
    profileCompact: "Perfil",
    verifyEmail: "Verifica el correu",
    emailCompact: "Email",
    activeSession: "Sessió activa. Obrir perfil",
    favorites: "Preferits",
    profile: "Perfil",
    brandHome: "NensGo - Inici",
    openMenu: "Obrir menú",
    closeMenu: "Tancar menú",
    primaryNavigation: "Navegació principal",
    openSearch: "Cercar",
    closeSearch: "Tancar cerca",
    searchPlaceholder: "Cercar activitats...",
  },
  footer: {
    text:
      "Activitats per a nens i famílies, organitzades per ajudar-te a decidir millor.",
    contactLabel: "Contacte:",
    legalLinks: [
      { label: "Política de privacitat", to: "/privacidad" },
      { label: "Termes d’ús", to: "/terminos" },
    ],
    legalAria: "Enllaços legals",
  },
  home: {
    seoTitle: "NensGo | Activitats per a nens i famílies a prop teu",
    seoDescription:
      "Descobreix activitats culturals, esportives, extraescolars i plans en família a prop teu. Explora opcions per ciutat, categoria i edat.",
    catalogSrTitle: "Catàleg d'activitats",
    catalogLoadErrorTitle: "No hem pogut carregar el catàleg",
    retry: "Torna-ho a provar",
    emptyTitle: "No hem trobat activitats per a aquests filtres",
    emptyDescription:
      "Prova de netejar la cerca o ajustar la zona i les categories.",
    clearFilters: "Netejar filtres",
  },
  landingHero: {
    eyebrow: "ACTIVITATS PER A NENS I FAMÍLIES",
    title: "Descobreix activitats per a nens i famílies en un sol lloc",
    description:
      "NensGo reuneix activitats culturals, esportives, extraescolars i plans en família per ajudar-te a trobar opcions a prop teu sense perdre temps saltant entre webs, xarxes i missatges.",
    cta: "Explorar activitats",
  },
  landingValueProps: {
    eyebrow: "TIPUS D'ACTIVITATS",
    title: "Què hi pots trobar",
    description:
      "Una forma més clara de descobrir propostes per al dia a dia i per a moments especials.",
  },
  landingBridge: {
    title: "Comença a explorar opcions",
    description:
      "Baixa al catàleg per veure activitats actives, filtrar per zona o categoria i quedar-te amb les que encaixen millor amb la teva família.",
    cta: "Explorar activitats",
  },
  about: {
    seoTitle: "Què és NensGo | Activitats per a nens i famílies",
    seoDescription:
      "Coneix NensGo, una forma senzilla de trobar activitats, tallers i plans familiars a prop teu.",
    eyebrow: "Sobre NensGo",
    title: "Què és NensGo",
    description:
      "Una forma més senzilla de trobar activitats, tallers i plans familiars a prop teu.",
    quickAccessItems: [
      {
        id: "extraescolares",
        title: "Extraescolars",
        description:
          "Opcions setmanals d'esport, art i suport escolar amb un sol accés ràpid.",
        targetCategoryLabels: ["Apoyo escolar", "Arte", "Deportes"],
      },
      {
        id: "talleres-puntuales",
        title: "Tallers i activitats puntuals",
        description:
          "Plans per provar alguna cosa nova entre setmana, caps de setmana o vacances.",
        targetCategoryLabels: ["Arte", "Cultura", "Familia", "Camps"],
      },
      {
        id: "deportes-movimiento",
        title: "Esports i moviment",
        description: "Escoles i activitats per moure's, jugar i gastar energia.",
        targetCategoryLabels: ["Deportes"],
      },
      {
        id: "cultura-familia",
        title: "Cultura i plans en família",
        description: "Teatre, museus i propostes culturals per gaudir junts.",
        targetCategoryLabels: ["Cultura", "Familia"],
      },
    ],
  },
  support: {
    title: "Suport",
    description:
      "Estem acabant aquest espai per ajudar-te amb dubtes i gestions del compte.",
    contactPrefix:
      "Per a dubtes, suggeriments o incidències pots escriure'ns a",
    contact:
      "Per a dubtes, suggeriments o incidències pots escriure'ns a {email}.",
    backToProfile: "Tornar al perfil",
  },
  catalog: {
    toolbar: {
      search: "Cercar",
      area: "Zona",
      categories: "Categories",
      intro: "Troba una activitat per nom, centre, ciutat o categoria.",
      clear: "Netejar",
      all: "Totes",
      searchAria: "Cercar per activitat, centre, ciutat o categoria",
      searchPlaceholder: "Cercar per activitat, centre o ciutat",
      categorySelectedOne: "1 seleccionada",
      categorySelectedMany: "{count} seleccionades",
    },
    card: {
      viewMore: "Veure més",
      fullCard: "Veure fitxa completa",
      free: "Gratis",
      addFavorite: "Afegir a preferits",
      removeFavorite: "Treure de preferits",
      share: "Compartir activitat",
      shareTitle: "Activitat a NensGo",
      shareText: "Mira aquesta activitat a NensGo: {title}",
      allAges: "Per a totes les edats",
      ageRange: "{min} a {max} anys",
      ageFrom: "Des de {min} anys",
      ageUntil: "Fins a {max} anys",
      consultAge: "Consulta l'edat",
      schedule: "Horari",
      consultSchedule: "Consulta l'horari",
      consultPrice: "Consulta el preu",
      consultCenter: "Consulta el centre",
      consultLocation: "Consulta la ubicació",
    },
    detail: {
      back: "Tornar",
      close: "Tancar detall",
      free: "Gratis",
      addFavorite: "Afegir a preferits",
      removeFavorite: "Treure de preferits",
      showMore: "Veure més",
      showLess: "Veure menys",
      contact: "Contacte",
      loadingContactOptions: "Carregant opcions de contacte.",
      contactOptionsError: "No hem pogut carregar el contacte ara mateix.",
      noContactOptions:
        "No hi ha cap canal de contacte publicat en aquest moment.",
      retryContacts: "Tornar a provar contactes",
      loadingContact: "Carregant contacte",
      chooseContact: "Triar contacte",
      contactAction: "Contactar",
      fallbackDescription: "Consulta més informació per WhatsApp.",
      ageLabel: "Edat",
      scheduleLabel: "Horari",
      priceLabel: "Preu",
      venueLabel: "Lloc",
      addressLabel: "Adreça",
      centerLabel: "Centre",
      cityLabel: "Ciutat",
    },
    contactOptions: {
      title: "Tria un canal",
      subtitle: "Contacta amb {title}",
      close: "Tancar opcions de contacte",
      back: "Tornar",
      form: "Formulari",
      instagram: "Instagram",
      phone: "Trucar",
      website: "Web",
    },
  },
  auth: {
    feedback: {
      authError:
        "No hem pogut completar l'accés ara mateix. Revisa les dades i torna-ho a provar.",
      profileError:
        "No hem pogut preparar el teu perfil ara mateix. Torna-ho a provar d'aquí a uns segons.",
      municipalityError: "No hem pogut carregar municipis ara mateix.",
      savedCityError: "No hem pogut carregar la ciutat guardada del perfil.",
      verificationSent:
        "T'hem enviat un correu de verificació. Revisa la safata d'entrada.",
    },
    common: {
      closeAccess: "Tancar accés",
      name: "Nom",
      lastName: "Cognom",
      email: "Correu electrònic",
      password: "Contrasenya",
      confirmPassword: "Confirmar contrasenya",
      showPassword: "Mostrar contrasenya",
      hidePassword: "Amagar contrasenya",
      googleContinue: "Continuar amb Google",
      googleConnecting: "Connectant amb Google...",
      signIn: "Iniciar sessió",
      createAccount: "Crear compte",
    },
    trust: {
      title: "La teva confiança és important per a nosaltres",
      data: {
        title: "Només et demanem l'email i la localitat",
        description:
          "per ajudar-te a trobar activitats a prop teu i personalitzar els missatges quan contactis.",
      },
      privacy: {
        title: "No demanem dades personals",
        description:
          "i mai les vendrem ni les compartirem.\nLa teva informació està segura amb nosaltres.",
      },
      account: {
        title: "Amb el teu compte podràs",
        description:
          "guardar les teves activitats favorites i compartir-les fàcilment amb amics i família.",
      },
    },
    anonymous: {
      welcome: "Benvingut",
      createTitle: "Crea el teu compte",
      signInDescription: "Accedeix amb Google o email",
      signUpDescription: "Registra't amb Google o email",
      signInDivider: "o continua amb email",
      signUpDivider: "o crea el compte amb email",
      signUpHint:
        "Només et demanarem la ciutat per guardar les teves preferències.",
      alreadyHaveAccount: "Ja tens compte?",
      noAccount: "No tens compte?",
      emailPasswordRequired: "Email i contrasenya són obligatoris.",
      passwordMismatch: "La confirmació de la contrasenya no coincideix.",
      creatingAccount: "Creant compte...",
      entering: "Entrant...",
    },
    loading: {
      eyebrow: "Preparant accés",
      title: "Estem resolent el teu compte",
      description:
        "Estem llegint les dades mínimes associades al teu compte autenticat per comprovar si ja podem continuar.",
    },
    verification: {
      eyebrow: "Verificació requerida",
      title: "Revisa el teu email abans de continuar",
      description:
        "El compte clàssic necessita verificació d'email abans de passar a l'onboarding obligatori i al flux normal de l'app.",
      pendingEmail: "Email pendent:",
      resendMissingEmail:
        "Necessitem un email per reenviar la verificació.",
      resending: "Reenviant email...",
      resend: "Reenviar verificació",
      alreadyVerified: "Ja he verificat el meu email",
    },
    onboarding: {
      eyebrow: "Onboarding obligatori",
      title: "Completa el teu perfil per continuar",
      description:
        "El compte ja està autenticat, però encara no té el perfil d'app llest o li falta la ciutat obligatòria.",
      cityLabel: "La teva ciutat o municipi",
      cityPlaceholder: "Cerca la teva ciutat o municipi",
      searching: "Cercant municipis...",
      noResults: "No hem trobat municipis per a aquesta cerca.",
      hint:
        "Comença a escriure almenys dues lletres. També pots cercar Roquetas o Les Roquetes.",
      nameRequired: "El nom és obligatori per completar el perfil.",
      cityRequired:
        "Selecciona una ciutat o municipi per completar l'accés.",
      saving: "Guardant perfil...",
      save: "Guardar i continuar",
    },
    error: {
      eyebrow: "Accés no llest",
      title: "No hem pogut preparar el teu accés",
      description:
        "L'autenticació ja existeix, però no hem pogut deixar llest el perfil d'aplicació amb la configuració actual.",
      retry: "Torna-ho a provar",
    },
  },
  protectedRoute: {
    loading: {
      eyebrow: "Accés",
      title: "Preparant el teu accés",
      description:
        "Estem comprovant l'accés social i les dades mínimes del compte per a aquesta ruta.",
    },
    verification: {
      eyebrow: "Verificació",
      title: "Falta verificar l'email",
      description:
        "Aquesta ruta necessita un compte verificat abans de continuar amb l'onboarding de perfil.",
      action: "Revisar verificació",
    },
    onboarding: {
      eyebrow: "Onboarding",
      title: "Falta completar el teu perfil",
      description:
        "El teu compte ja existeix, però encara falta completar el perfil mínim obligatori.",
      action: "Completar perfil",
    },
    error: {
      eyebrow: "Accés",
      title: "No hem pogut carregar el teu perfil",
      description:
        "No hem pogut deixar el teu accés llest amb la configuració actual.",
      retry: "Torna-ho a provar",
      continue: "Continuar accés",
    },
    anonymous: {
      eyebrow: "Accés",
      title: "Necessites accedir per continuar",
      description:
        "Aquesta pantalla necessita un compte identificat i un perfil d'app llest per quedar disponible.",
      action: "Accedir",
    },
  },
  profile: {
    loadingLabel: "Preparant el teu compte",
    loadingTitle: "Ja gairebé pots revisar el teu compte.",
    loadingDescription:
      "Estem carregant les teves dades per mostrar-te el perfil d'aquí a un moment.",
    back: "Tornar",
    title: "El teu compte",
    description:
      "Revisa les dades bàsiques del teu compte i tanca sessió quan ho necessitis.",
    identityDescription:
      "Aquí pots revisar les dades principals associades al teu compte dins de NensGo.",
    visibleName: "Nom visible",
    email: "Email",
    city: "Municipi o localitat",
    cityPlaceholder: "Cerca el teu municipi o localitat",
    cityHelp:
      "Comença a escriure almenys dues lletres i selecciona una opció.",
    emailReadonlyHelp:
      "Aquest email pertany al teu compte i no s'edita des d'aquesta pantalla.",
    unavailable: "No disponible",
    noCity: "Sense municipi associat",
    authError:
      "No hem pogut actualitzar la informació del teu compte ara mateix.",
    nameRequired: "El nom és obligatori.",
    cityRequired: "Selecciona un municipi o localitat.",
    save: "Guardar canvis",
    saving: "Guardant...",
    saveSuccess: "Canvis guardats.",
    saveError: "No hem pogut guardar els canvis ara mateix.",
    publicationsTitle: "Les meves publicacions",
    publicationsDescription:
      "Consulta l'estat de les teves publicacions o envia una activitat perque NensGo la revisi.",
    publicationsAction: "Les meves publicacions",
    submitActivityAction: "Enviar activitat",
    internalDescription:
      "Si formes part de l'equip, pots obrir el Draft Inbox des d'aquí.",
    internalAction: "Obrir Draft Inbox",
    signingOut: "Tancant sessió...",
    signOut: "Tancar sessió",
    anonymousTitle: "Accedeix per veure el teu compte",
    anonymousDescription:
      "Entra amb Google o amb el teu email per revisar les dades i recuperar les activitats guardades.",
    openEmailAccess: "Obrir accés amb email",
    returnHint: "Tornaràs aquí després de completar l'accés.",
  },
  userPublications: {
    back: "Tornar al perfil",
    eyebrow: "Publicacions",
    title: "Les meves publicacions",
    description:
      "Consulta l'estat de les activitats que has enviat o editat per a NensGo.",
    loadingEyebrow: "Publicacions",
    loadingTitle: "Carregant les teves publicacions",
    loadingDescription:
      "Estem preparant l'estat de les teves activitats enviades.",
    errorEyebrow: "Publicacions",
    loadErrorTitle: "No hem pogut carregar les teves publicacions",
    loadErrorDescription: "Torna-ho a provar d'aqui a uns segons.",
    retry: "Torna-ho a provar",
    emptyEyebrow: "Publicacions",
    emptyTitle: "Encara no tens publicacions enviades",
    emptyDescription:
      "Encara no tens publicacions enviades. Pots enviar una activitat perque NensGo la revisi.",
    status: {
      inReview: "En revisio",
      needsChanges: "Necessita canvis",
      published: "Publicada",
      unpublished: "Despublicada",
      rejected: "No aprovada",
      archived: "Arxivada",
    },
    actions: {
      submit: "Enviar activitat",
      correct: "Corregir",
      edit: "Editar publicacio",
      unpublish: "Despublicar",
      unpublishing: "Despublicant...",
      unpublishConfirm:
        "Aquesta activitat deixara de veure's al cataleg public. Per tornar-la a publicar necessitara revisio de NensGo.",
      unpublishSuccess: "Activitat despublicada.",
      unpublishError: "No hem pogut despublicar aquesta activitat.",
    },
  },
  userPublicationForm: {
    back: "Tornar a les meves publicacions",
    cancel: "Cancel-lar",
    submitting: "Enviant...",
    loadingEyebrow: "Publicacio",
    loadingTitle: "Carregant formulari",
    loadingDescription: "Estem preparant la publicacio i les seves opcions.",
    errorEyebrow: "Publicacio",
    loadErrorTitle: "No hem pogut carregar aquesta publicacio",
    loadErrorDescription: "Torna-ho a provar d'aqui a uns segons.",
    submitErrorDescription: "No hem pogut enviar la publicacio.",
    noOptionsTitle: "No hem pogut preparar les opcions",
    noOptionsDescription:
      "El formulari necessita categories i tipus disponibles abans d'enviar canvis.",
    recovery: {
      title: "Hem restaurat un esborrany local no desat.",
      imageNote: "Cal tornar a triar la imatge seleccionada.",
      discard: "Descartar esborrany local",
    },
    new: {
      eyebrow: "Enviar activitat",
      title: "Enviar activitat",
      description:
        "Completa la informacio de l'activitat perque la puguem revisar.",
      submit: "Enviar activitat",
      success: "Activitat enviada. NensGo la revisara abans de publicar-la.",
    },
    correction: {
      eyebrow: "Correccio",
      title: "Corregir publicacio",
      description: "Revisa els canvis que ha demanat NensGo.",
      submit: "Enviar correccio",
      success:
        "Correccio enviada. NensGo tornara a revisar la publicacio.",
    },
    edit: {
      eyebrow: "Edicio",
      title: "Editar publicacio",
      description: "Prepara canvis per a revisio de NensGo.",
      warning:
        "Editar aquesta publicacio la traura temporalment del cataleg public fins que NensGo revisi els canvis.",
      submit: "Enviar canvis",
      success:
        "Canvis enviats. L'activitat queda fora del cataleg public fins que NensGo els aprovi.",
    },
    validation: {
      title: "El titol es obligatori.",
      description: "La descripcio es obligatoria.",
      center: "El centre es obligatori.",
      proposedCenterName: "Indica el nom del centre proposat.",
      category: "La categoria es obligatoria.",
      type: "El tipus es obligatori.",
      schedule: "L'horari es obligatori.",
      ageRange: "La regla d'edat rang necessita edat minima i maxima.",
      ageFrom: "La regla d'edat des de necessita edat minima.",
      ageUntil: "La regla d'edat fins a necessita edat maxima.",
    },
  },
  favorites: {
    title: "Les teves activitats guardades",
    description:
      "Revisa amb més calma les activitats que t'interessen i obre'n la fitxa completa quan vulguis decidir amb més context.",
    loadErrorTitle: "No hem pogut carregar els teus preferits",
    noSavedTitle: "Encara no has guardat activitats",
    noSavedDescription:
      "Fes servir el cor al catàleg per recuperar aquí les opcions que vulguis revisar més tard.",
    backHome: "Tornar a Home",
    unavailableTitle: "Els teus preferits ja no estan disponibles",
    unavailableDescription:
      "Les activitats que havies guardat ja no es poden recuperar des del catàleg actual. Torna a explorar per guardar noves opcions.",
    explore: "Explorar activitats",
    detailLoadingTitle: "Carregant la fitxa",
    detailLoadingDescription:
      "Estem preparant la informació completa d'aquesta activitat.",
    detailLoadErrorTitle: "No hem pogut carregar aquesta activitat",
    activityUnavailableTitle: "Aquesta activitat ja no està disponible",
    activityUnavailableDescription:
      "L'activitat continua guardada, però no l'hem pogut recuperar des del catàleg actual.",
    activityNotFoundTitle: "No hem trobat aquesta activitat",
    activityNotFoundDescription:
      "La fitxa que intentes obrir no existeix al catàleg actual. Torna a preferits per seguir revisant les activitats guardades.",
    noLongerFavoriteTitle: "Aquesta activitat ja no és als teus preferits",
    noLongerFavoriteDescription:
      "Torna a la llista per seguir revisant les activitats que encara tens guardades.",
    backToFavorites: "Tornar a preferits",
  },
  paraCentros: {
    seoTitle: "Per a centres | Publica les teves activitats a NensGo",
    seoDescription:
      "Mostra les teves activitats, tallers i propostes familiars en un entorn pensat per a famílies.",
    hero: {
      kicker: "Ofereixes activitats per a nens o famílies?",
      title: "Fes que la teva proposta arribi millor a les famílies.",
      description:
        "NensGo és una plataforma d'activitats infantils i familiars que vol reunir en un sol lloc propostes que avui estan disperses entre xarxes, grups i canals poc clars. Aquesta pàgina presenta la visió del projecte, la plataforma que estem construint i la convocatòria oberta per a tallers, esport, art, cultura i espais per a nens que vulguin sumar-s'hi des del principi.",
      points: [
        "Més visibilitat local per a activitats de qualitat.",
        "Una presentació clara perquè les famílies entenguin ràpid la teva proposta.",
        "Un procés simple per començar a formar part del projecte.",
      ],
      panelTitle: "Un aparador digital clar",
      panelDescription:
        "La teva proposta es mostra de manera simple, visual i fàcil d'entendre.",
      featureItems: [
        "Tipus d'activitat i edats recomanades.",
        "Ubicació, horaris i zona de treball.",
        "Descripció breu i visual de la proposta.",
        "Imatges i forma de contacte.",
      ],
    },
    story: {
      kicker: "La nostra història",
      title: "Així va néixer NensGo",
      description:
        "NensGo neix d'una necessitat molt concreta: trobar activitats ben explicades, properes i diferents de les de sempre.",
      intro: [
        "Som una família a qui li encanta fer plans. Sempre busquem noves activitats, propostes diferents i experiències que ens permetin descobrir coses, compartir temps de qualitat i, sobretot, regalar al nostre fill oportunitats per aprendre, gaudir i viure alguna cosa nova.",
      ],
      challenge: [
        "Amb el temps vam anar notant una cosa que segurament passa a moltes famílies: trobar activitats interessants no sempre és fàcil.",
        "Moltes vegades la informació està dispersa, incompleta o costa moltíssim arribar a propostes diferents de les de sempre.",
      ],
      calloutEyebrow: "Ho vam començar a sentir una vegada i una altra",
      promptIntro:
        "També ens va passar que, gairebé sense voler, vam començar a convertir-nos en una mena de referència per a altres famílies.",
      prompts: [
        '"Vosaltres que sempre feu coses... què ens recomaneu?"',
        '"Teniu alguna idea per aquest cap de setmana?"',
        '"On vau trobar aquesta activitat?"',
      ],
      bridge:
        "I així, entre missatges, recomanacions i enllaços compartits, vam veure una necessitat molt clara: per què no crear un lloc on tot això es pugui trobar d'una manera més fàcil i ordenada?",
      closing: [
        "Per això NensGo neix amb una idea molt simple: ajudar les famílies a descobrir activitats a prop seu, donar visibilitat a petits projectes, tallers, espais i propostes locals, i reunir en un sol lloc opcions per gaudir amb fills i en família.",
        'Volem facilitar la cerca, inspirar nous plans i fer que trobar alguna cosa per fer no depengui de tenir "el contacte correcte" o que just algú et passi la informació.',
        "Perquè creiem que hi ha moltíssim per descobrir, i que compartir-ho també és una forma de construir comunitat.",
      ],
      summaryEyebrow: "El que volem construir",
      summaryTitle: "Un lloc més clar per descobrir plans en família",
      missionPoints: [
        "Ajudar les famílies a descobrir activitats a prop seu.",
        "Donar visibilitat a petits projectes, tallers, espais i propostes locals.",
        "Reunir en un sol lloc opcions per gaudir amb fills i en família.",
      ],
    },
    idea: {
      kicker: "La idea base",
      title: "Una forma clara, moderna i pràctica de descobrir activitats",
      description:
        "Cada proposta es presenta en una fitxa visual i ordenada perquè una família entengui ràpid si encaixa amb el que busca.",
      paragraphs: [
        "NensGo vol ser aquell lloc on descobrir plans sigui senzill: una experiència pensada per veure en pocs segons què és cada activitat, per a quines edats està pensada i on trobar-la.",
        "La fitxa que veus aquí resumeix aquesta idea: una proposta ben presentada, amb la informació important a la vista i una estructura que ajuda a decidir sense haver de remenar entre missatges, xarxes o enllaços solts.",
        "Busquem una solució moderna, organitzativa i pràctica: un espai cuidat per a les famílies i, alhora, una forma clara de mostrar cada projecte amb ordre, context i utilitat real.",
      ],
      previewEyebrow: "Així es veurà una activitat",
    },
    activityExample: {
      category: "Art",
      title: "Taller de pintura creativa",
      ages: "7 a 12 anys",
      center: "Espai Creatiu Ribes",
      locality: "Sant Pere de Ribes",
      cta: "Veure més",
      imageAlt: "Tres nens pintant en un cavallet, vistos d'esquena.",
    },
    preview: {
      description:
        "Sessions creatives per a nens que volen experimentar amb color, composició i materials en un entorn guiat i proper.",
      schedule: "Dimarts i dijous, 17:30 a 19:00",
      price: "Des de 42 EUR al mes",
      venue: "Espai Creatiu Ribes",
      address: "Carrer de la Pintura, 12",
      city: "Sant Pere de Ribes",
      contactTitle: "Contactar",
      contactCopy:
        "Parla directament amb el centre per demanar més informació.",
      contactCta: "Contactar",
      back: "Tornar",
      close: "Tancar vista prèvia",
      age: "Edat",
      scheduleLabel: "Horari",
      priceLabel: "Preu",
      center: "Centre",
      addressLabel: "Adreça",
      cityLabel: "Ciutat",
    },
    benefits: {
      kicker: "Què guanya el teu projecte?",
      title: "Més visibilitat, més claredat i més oportunitats de contacte",
      description:
        "NensGo està pensat perquè projectes reals guanyin presència sense perdre temps en una web complexa.",
      items: [
        {
          title: "Més visibilitat",
          description:
            "La teva activitat apareix en un espai centrat en plans i serveis per a nens i famílies.",
        },
        {
          title: "Més claredat",
          description:
            "La proposta es presenta de forma ordenada perquè una família entengui ràpid si encaixa.",
        },
        {
          title: "Més oportunitats de contacte",
          description:
            "Facilitem que nous interessats descobreixin la teva activitat i vulguin saber-ne més.",
        },
      ],
      futureTitle: "Més endavant",
      futureText:
        "També volem compartir senyals útils per ajudar-te a entendre millor l'interès que genera la teva activitat:",
      futureSignals: [
        "Quins tipus d'activitats desperten més interès.",
        "Quines zones concentren més cerques.",
        "Quines fitxes generen més clics o contactes.",
      ],
    },
    audience: {
      kicker: "A qui va dirigit?",
      title: "A centres, activitats i projectes pensats per a nens i famílies",
      description:
        "Si la teva proposta aporta valor a famílies i nens, ens interessa conèixer-la.",
      items: [
        "Acadèmies i centres formatius.",
        "Activitats extraescolars i esportives.",
        "Tallers artístics, creatius i culturals.",
        "Espais familiars, casals i propostes de temporada.",
        "Professionals o entitats que treballin amb nens i famílies.",
      ],
    },
    requiredInfo: {
      kicker: "Què necessitem de tu?",
      title: "Només unes poques dades per valorar la teva proposta",
      description:
        "Només demanem una primera informació bàsica per entendre el projecte i poder parlar amb tu.",
      items: [
        "Qui ets o quina entitat representes.",
        "Quina activitat o servei ofereixes.",
        "En quina zona treballes.",
        "Per a quines edats està pensada la teva proposta.",
        "Una forma de contacte.",
      ],
    },
    product: {
      kicker: "Quin tipus d'espai volem crear?",
      title: "Un espai útil, cuidat i de valor real",
      description:
        "NensGo no vol ser un llistat sense criteri. Volem crear un espai on les famílies trobin propostes fiables i on qui organitza activitats es pugui mostrar de forma clara.",
      text:
        "Per això ens interessa comptar amb projectes reals, ben explicats i amb ganes de formar part d'una plataforma pensada per connectar millor l'oferta amb la demanda.",
      imageAlt:
        "Vista prèvia de l'aplicació NensGo amb cercador, filtres i targetes d'activitats.",
      caption:
        "Vista real de l'aplicació que guiarà les famílies a descobrir activitats de forma més clara.",
    },
    cta: {
      kicker: "Vols unir-te al projecte?",
      title: "La teva activitat pot formar part de NensGo.",
      text:
        "Escriu-nos per email per explicar-nos la teva proposta i et respondrem des de NensGo.",
      contactNote: "També pots escriure'ns directament a",
      action: "Vull participar",
    },
  },
};

export default ca;
