// Public scene addresses; renderer paths remain independent of viewer navigation.
export const scenePath = id => id && id !== 'home' ? `/scenes/${id}/` : '/';

export function sceneFromLocation({ pathname, hash }, order) {
  const candidate = hash ? hash.slice(1) : /^\/scenes\/([a-z0-9-]+)\/?$/.exec(pathname)?.[1];
  return order.includes(candidate) ? candidate : 'home';
}

export function updatePageMetadata(metadata, document) {
  document.title = metadata.title;
  document.querySelector('link[rel="canonical"]').href = metadata.url;
  for (const [attribute, key, value] of [
    ['name', 'description', metadata.description],
    ['property', 'og:title', metadata.title],
    ['property', 'og:description', metadata.description],
    ['property', 'og:url', metadata.url],
    ['property', 'og:image', metadata.image],
    ['property', 'og:image:width', metadata.width],
    ['property', 'og:image:height', metadata.height],
    ['property', 'og:image:alt', metadata.alt],
    ['name', 'twitter:title', metadata.title],
    ['name', 'twitter:description', metadata.description],
    ['name', 'twitter:image', metadata.image]
  ]) document.querySelector(`meta[${attribute}="${key}"]`).content = String(value);
  document.getElementById('sceneTitle').textContent = metadata.name;
  document.getElementById('sceneDescription').textContent = metadata.description;
  const structured = document.querySelector('script[type="application/ld+json"]');
  const data = JSON.parse(structured.textContent);
  for (const key of ['name', 'url', 'description', 'image']) data[key] = metadata[key];
  structured.textContent = JSON.stringify(data);
}
