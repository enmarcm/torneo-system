/**
 * Descarga de archivos que funciona igual en escritorio y en móvil.
 *
 * En escritorio (y en Android) basta con un <a download> apuntando a un blob:
 * el atributo se ignora si la URL es de otro origen (MinIO), por eso siempre
 * se baja el archivo primero y se genera un blob local.
 *
 * En iOS ese <a download> abre la imagen en otra pestaña en vez de guardarla,
 * así que se intenta primero la Web Share API con archivos, que es la vía que
 * deja al usuario mandarla a Fotos / WhatsApp desde el mismo diálogo del sistema.
 */
export type DownloadResult = 'shared' | 'downloaded' | 'opened' | 'cancelled';

const canShareFile = (file: File) =>
  typeof navigator !== 'undefined' &&
  typeof navigator.canShare === 'function' &&
  typeof navigator.share === 'function' &&
  navigator.canShare({ files: [file] });

const anchorDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revocar de inmediato cancela la descarga en algunos navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

/** Extensión coherente con el mime real del archivo, no con la URL. */
const extFromMime = (mime: string, fallback = 'jpg') => {
  const sub = mime.split('/')[1]?.split('+')[0];
  if (!sub) return fallback;
  return sub === 'jpeg' ? 'jpg' : sub;
};

/** Nombre de archivo sin caracteres que rompan en Windows/iOS. */
export const safeFileName = (name: string) =>
  name.trim().replace(/[\/:*?"<>|]/g, '').replace(/\s+/g, '-') || 'archivo';

/**
 * @param url      URL pública del archivo.
 * @param baseName Nombre deseado sin extensión.
 */
export const downloadFile = async (url: string, baseName: string): Promise<DownloadResult> => {
  const name = safeFileName(baseName);
  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const fileName = `${name}.${extFromMime(blob.type)}`;
    const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });

    if (canShareFile(file)) {
      try {
        await navigator.share({ files: [file], title: fileName });
        return 'shared';
      } catch (err) {
        // El usuario cerró el diálogo: no hay que insistir con otra descarga.
        if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
        // NotAllowedError (iOS pierde el gesto tras el await) → seguimos por <a>.
      }
    }

    anchorDownload(blob, fileName);
    return 'downloaded';
  } catch {
    // Sin CORS o sin red: al menos se abre la imagen para guardarla a mano.
    window.open(url, '_blank', 'noopener');
    return 'opened';
  }
};
