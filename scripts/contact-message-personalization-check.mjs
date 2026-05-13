import assert from "node:assert/strict";
import { buildActivityContactActionUrl } from "../src/helpers/buildActivityContactAction.js";

const activity = {
  title: "Taller de pintura creativa",
  city_name: "Sitges",
};

const requester = {
  requesterName: "Brandon",
};

function getSearchParam(url, name) {
  return new URL(url).searchParams.get(name);
}

const whatsappUrl = buildActivityContactActionUrl(
  activity,
  {
    contactMethod: "whatsapp",
    contactValue: "+34 600 111 222",
  },
  requester,
);

assert.equal(new URL(whatsappUrl).hostname, "wa.me");
assert.equal(new URL(whatsappUrl).pathname, "/34600111222");
assert.equal(
  getSearchParam(whatsappUrl, "text"),
  'Hola, soy Brandon. Me interesa la actividad "Taller de pintura creativa" en Sitges. ¿Podrías darme más información?',
);

const emailUrl = buildActivityContactActionUrl(
  activity,
  {
    contactMethod: "email",
    contactValue: "hola@example.com",
  },
  requester,
);

const email = new URL(emailUrl);
assert.equal(email.protocol, "mailto:");
assert.equal(email.pathname, "hola@example.com");
assert.equal(email.searchParams.get("subject"), "Consulta sobre Taller de pintura creativa");
assert.equal(
  email.searchParams.get("body"),
  'Hola, soy Brandon. Me interesa la actividad "Taller de pintura creativa" en Sitges. ¿Podrías darme más información?',
);

const fallbackUrl = buildActivityContactActionUrl(activity, {
  contactMethod: "whatsapp",
  contactValue: "600111222",
});

assert.equal(
  getSearchParam(fallbackUrl, "text"),
  'Hola, me interesa la actividad "Taller de pintura creativa" en Sitges. ¿Podrías darme más información?',
);

const phoneUrl = buildActivityContactActionUrl(
  activity,
  {
    contactMethod: "phone",
    contactValue: "+34 600 111 222",
  },
  requester,
);

assert.equal(phoneUrl, "tel:+34600111222");

const webUrl = buildActivityContactActionUrl(
  activity,
  {
    contactMethod: "web",
    contactValue: "example.com/contacto",
  },
  requester,
);

assert.equal(webUrl, "https://example.com/contacto");

console.log("contact-message-personalization-check: ok");
