// Utilidades para generar URLs correctas en GitHub Pages
export function getBaseUrl() {
  return import.meta.env.BASE_URL || '/';
}

export function getUrl(path: string) {
  const baseUrl = getBaseUrl();
  // Asegurar que el path no empiece con /
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Si baseUrl ya termina con /, no agregar otra
  if (baseUrl.endsWith('/')) {
    return `${baseUrl}${cleanPath}`;
  }
  return `${baseUrl}/${cleanPath}`;
}

export function getAssetUrl(asset: string) {
  return getUrl(asset);
}
