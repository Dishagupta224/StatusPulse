function normalizeServiceInput(payload = {}) {
  return {
    name: typeof payload.name === "string" ? payload.name.trim() : "",
    url: typeof payload.url === "string" ? payload.url.trim() : "",
  };
}

function validateServiceInput(payload = {}) {
  const { name, url } = normalizeServiceInput(payload);
  const errors = [];

  if (!name) {
    errors.push("Name is required.");
  } else if (name.length > 100) {
    errors.push("Name must be 100 characters or fewer.");
  }

  if (!url) {
    errors.push("URL is required.");
  } else {
    let parsedUrl = null;

    try {
      parsedUrl = new URL(url);
    } catch (_error) {
      errors.push("URL must be a valid absolute http/https URL.");
    }

    if (parsedUrl && !["http:", "https:"].includes(parsedUrl.protocol)) {
      errors.push("URL protocol must be http or https.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: { name, url },
  };
}

module.exports = {
  normalizeServiceInput,
  validateServiceInput,
};
