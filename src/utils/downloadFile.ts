import { ViaticosService } from '@/services/viaticos.service';

import type { Viatico } from '@/hooks/useViaticos';

export async function handleFileDownload(viatico: Pick<Viatico, 'viatico_url'>) {
  if (!viatico.viatico_url) return;
  
  try {
    const url = ViaticosService.createDownloadUrl(viatico);
    if (!url) return;

    const blob = await ViaticosService.downloadFile(url);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = viatico.viatico_url.split('/').pop() || 'archivo.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error al descargar el archivo:', error);
  }
}
