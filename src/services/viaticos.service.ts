import type { Viatico } from '@/hooks/useViaticos';

export type { Viatico };
import api from '@/lib/api';


export class ViaticosService {
  static async getAll(): Promise<Viatico[]> {
    const response = await api.get<Viatico[]>('/viaticos');
    return response.data;
  }

  static async delete(id: number): Promise<void> {
    await api.delete(`/viaticos/${id}`);
  }


  static async marcarComoPagado(id: number): Promise<void> {
    await api.put(`/viaticos/${id}/pagar`);
  }

  static async getPagados(): Promise<Viatico[]> {
    const response = await api.get<Viatico[]>('/viaticos?estado=pagado');
    return response.data;
  }
}
