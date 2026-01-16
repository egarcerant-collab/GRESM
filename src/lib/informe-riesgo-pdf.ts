import type { InformeDatos, DocImages } from './types';

export async function generarInformePDF(
    datos: InformeDatos,
    images: DocImages,
    filename?: string,
    returnBlob?: boolean
): Promise<Blob | void> {
    console.log("generarInformePDF called", { filename, returnBlob });
    alert("La generación de PDF está en desarrollo.");
    if (returnBlob) {
        return new Blob();
    }
}
