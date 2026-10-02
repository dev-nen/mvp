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

// UI language changes the prepared message, never dynamic names or contact data.
for (const language of ["es", "ca", "en"]) {
  const dynamicActivity = { title: "Pintura & música / Júlia", city_name: "Sant Pere de Ribes" };
  const context = { requesterName: "  Ana & Júlia  ", language };
  const greetingStart = { es: "Hola, soy Ana & Júlia.", ca: "Hola, soc Ana & Júlia.", en: "Hello, my name is Ana & Júlia." }[language];
  for (const [contactMethod, contactValue, parameter] of [["whatsapp", "+34 600 111 222", "text"], ["email", "centro@example.test", "body"]]) {
    const prepared = new URL(buildActivityContactActionUrl(dynamicActivity, { contactMethod, contactValue }, context));
    const message = prepared.searchParams.get(parameter);
    assert.ok(message.startsWith(greetingStart));
    assert.ok(message.includes(dynamicActivity.title));
    assert.ok(message.includes(dynamicActivity.city_name));
    const withoutName = new URL(buildActivityContactActionUrl(dynamicActivity, { contactMethod, contactValue }, { language }));
    assert.ok(withoutName.searchParams.get(parameter).includes(dynamicActivity.title));
    assert.equal(withoutName.searchParams.get(parameter).includes("Ana & Júlia"), false);
  }
}
assert.equal(buildActivityContactActionUrl(activity, { contactMethod: "website", contactValue: "javascript:alert(1)" }), "");

console.log("contact-message-personalization-check: ok (ES/CA/EN, optional names, safe encoding, unchanged dynamic values)");
