/**
 * Compression d'image côté client avant upload : redimensionne à 1920 px max
 * et réencode en JPEG. Une photo de téléphone de 6 Mo part en ~400 Ko —
 * essentiel sur les réseaux mobiles tunisiens, et reste sous la limite de
 * corps des Server Actions. Browser-only (createImageBitmap/canvas) : à
 * n'appeler que depuis un composant client.
 *
 * Partagé par le gestionnaire de photos (édition) et le formulaire de création.
 */
export async function compressImage(file: File): Promise<File> {
  // Déjà léger : on ne touche pas.
  if (file.size < 600 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const MAX_EDGE = 1920;
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82)
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    // Format non décodable par le navigateur : le serveur tranchera.
    return file;
  }
}

/**
 * Applique {@link compressImage} à tous les fichiers d'un `<input type=file>`
 * et réinjecte le résultat dans l'input (via DataTransfer) pour que le form
 * envoie les versions compressées. À brancher sur `onChange`.
 */
export async function compressFileInput(input: HTMLInputElement): Promise<void> {
  const files = [...(input.files ?? [])];
  if (files.length === 0) return;
  const compressed = await Promise.all(files.map(compressImage));
  const dt = new DataTransfer();
  compressed.forEach((f) => dt.items.add(f));
  input.files = dt.files;
}
