export function candidatePhotoUrl(photoUrl) {
  if (!photoUrl) return null;
  if (/^https?:\/\//i.test(photoUrl)) return photoUrl;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const backendUrl = apiUrl.replace(/\/api\/?$/, '');
  const storageUrl = import.meta.env.VITE_STORAGE_URL || `${backendUrl}/storage`;
  if (photoUrl.startsWith('/storage/')) return `${backendUrl}${photoUrl}`;
  return `${storageUrl.replace(/\/$/, '')}/${photoUrl.replace(/^\//, '')}`;
}
