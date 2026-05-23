const INSTAGRAM_HANDLE_PATTERN = /^(?!.*\.\.)(?!\.)(?!.*\.$)[A-Za-z0-9._]{1,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CONTACT_OPTION_TYPES = [
  "whatsapp",
  "phone",
  "email",
  "website",
  "form",
  "instagram",
];

export const CONTACT_OPTION_TYPE_CHOICES = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Telefono" },
  { value: "email", label: "Email" },
  { value: "website", label: "Web" },
  { value: "form", label: "Formulario" },
  { value: "instagram", label: "Instagram" },
];

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeContactType(value) {
  const normalizedValue = getTrimmedText(value).toLowerCase();

  if (normalizedValue === "web") {
    return "website";
  }

  if (CONTACT_OPTION_TYPES.includes(normalizedValue)) {
    return normalizedValue;
  }

  return "";
}

function safeParseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function normalizeWebsiteUrl(value) {
  const rawValue = getTrimmedText(value);

  if (!rawValue) {
    return "";
  }

  const candidate = /^https?:\/\//i.test(rawValue)
    ? rawValue
    : `https://${rawValue}`;
  const parsedUrl = safeParseUrl(candidate);

  if (!parsedUrl || !["http:", "https:"].includes(parsedUrl.protocol)) {
    return "";
  }

  return parsedUrl.toString();
}

function normalizePhoneValue(value) {
  const rawValue = getTrimmedText(value);

  if (!rawValue) {
    return "";
  }

  const normalizedValue = rawValue.replace(/[^\d+]/g, "");

  if (!/\d{6,}/.test(normalizedValue.replace(/\D+/g, ""))) {
    return "";
  }

  return normalizedValue;
}

function normalizeWhatsappValue(value) {
  const rawValue = getTrimmedText(value);

  if (!rawValue) {
    return "";
  }

  const normalizedValue = rawValue.replace(/\D+/g, "");

  if (!/\d{6,}/.test(normalizedValue)) {
    return "";
  }

  return normalizedValue;
}

function normalizeEmailValue(value) {
  const normalizedValue = getTrimmedText(value).toLowerCase();

  return EMAIL_PATTERN.test(normalizedValue) ? normalizedValue : "";
}

export function normalizeInstagramContact(value) {
  const rawValue = getTrimmedText(value);

  if (!rawValue) {
    return {
      error: "",
      handle: "",
      url: "",
    };
  }

  let candidateHandle = rawValue;

  if (/^https?:\/\//i.test(rawValue)) {
    const parsedUrl = safeParseUrl(rawValue);
    const hostname = parsedUrl?.hostname.replace(/^www\./i, "").toLowerCase();

    if (!parsedUrl || hostname !== "instagram.com") {
      return {
        error:
          "Revisa el usuario de Instagram. Puedes escribirlo como @usuario o pegar el enlace completo.",
        handle: "",
        url: "",
      };
    }

    const [firstPathSegment = ""] = parsedUrl.pathname
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);

    candidateHandle = firstPathSegment;
  } else if (/^[a-z][a-z0-9+.-]*:/i.test(rawValue)) {
    return {
      error:
        "Revisa el usuario de Instagram. Puedes escribirlo como @usuario o pegar el enlace completo.",
      handle: "",
      url: "",
    };
  }

  const normalizedHandle = candidateHandle.replace(/^@+/, "").trim();

  if (!INSTAGRAM_HANDLE_PATTERN.test(normalizedHandle)) {
    return {
      error:
        "Revisa el usuario de Instagram. Puedes escribirlo como @usuario o pegar el enlace completo.",
      handle: "",
      url: "",
    };
  }

  return {
    error: "",
    handle: normalizedHandle,
    url: `https://www.instagram.com/${normalizedHandle}/`,
  };
}

export function createEmptyContactOption() {
  return {
    isPrimary: false,
    label: "",
    type: "whatsapp",
    value: "",
  };
}

export function mapPayloadContactOptionsToFormState(payload) {
  const contactOptions = Array.isArray(payload?.contact_options)
    ? payload.contact_options
    : [];

  return contactOptions
    .map((contactOption) => {
      const type = normalizeContactType(
        contactOption?.type ?? contactOption?.contact_method,
      );
      const fallbackValue =
        contactOption?.raw_value ??
        contactOption?.normalized_value ??
        contactOption?.url ??
        contactOption?.contact_value ??
        "";

      return {
        isPrimary: contactOption?.is_primary === true,
        label: getTrimmedText(
          contactOption?.label ?? contactOption?.contact_label,
        ),
        type: type || "website",
        value: getTrimmedText(fallbackValue),
      };
    })
    .filter((contactOption) => contactOption.type && contactOption.value);
}

export function normalizeContactOptionForPayload(contactOption) {
  const type = normalizeContactType(contactOption?.type);
  const rawValue = getTrimmedText(contactOption?.value);
  const label = getTrimmedText(contactOption?.label);
  const isPrimary = contactOption?.isPrimary === true;

  if (!type && !rawValue && !label) {
    return {
      contactOption: null,
      error: "",
    };
  }

  if (!type) {
    return {
      contactOption: null,
      error: "Elige un tipo de contacto.",
    };
  }

  if (!rawValue) {
    return {
      contactOption: null,
      error: "Anade un valor para la opcion de contacto.",
    };
  }

  let normalizedValue = "";
  let url = "";

  if (type === "whatsapp") {
    normalizedValue = normalizeWhatsappValue(rawValue);
    url = normalizedValue ? `https://wa.me/${normalizedValue}` : "";
  } else if (type === "phone") {
    normalizedValue = normalizePhoneValue(rawValue);
    url = normalizedValue ? `tel:${normalizedValue}` : "";
  } else if (type === "email") {
    normalizedValue = normalizeEmailValue(rawValue);
    url = normalizedValue ? `mailto:${normalizedValue}` : "";
  } else if (type === "website" || type === "form") {
    url = normalizeWebsiteUrl(rawValue);
    normalizedValue = url;
  } else if (type === "instagram") {
    const instagramContact = normalizeInstagramContact(rawValue);

    if (instagramContact.error) {
      return {
        contactOption: null,
        error: instagramContact.error,
      };
    }

    normalizedValue = instagramContact.handle;
    url = instagramContact.url;
  }

  if (!normalizedValue || !url) {
    return {
      contactOption: null,
      error: "Revisa el valor de la opcion de contacto.",
    };
  }

  const normalizedContactOption = {
    type,
    raw_value: rawValue,
    normalized_value: normalizedValue,
    url,
    is_primary: isPrimary,
  };

  if (label) {
    normalizedContactOption.label = label;
  }

  return {
    contactOption: normalizedContactOption,
    error: "",
  };
}

export function normalizeContactOptionsForPayload(contactOptions) {
  const normalizedContactOptions = [];
  const errors = [];

  (Array.isArray(contactOptions) ? contactOptions : []).forEach(
    (contactOption, index) => {
      const result = normalizeContactOptionForPayload(contactOption);

      if (result.error) {
        errors.push({
          field: `contactOptions.${index}`,
          message: result.error,
        });
        return;
      }

      if (result.contactOption) {
        normalizedContactOptions.push(result.contactOption);
      }
    },
  );

  return {
    contactOptions: normalizedContactOptions,
    errors,
  };
}

export function getContactOptionValidationMessage(contactOption) {
  return normalizeContactOptionForPayload(contactOption).error;
}
