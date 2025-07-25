'use client';

import { useState, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { RecurrentesService } from '@/services/recurrentes.service';
// import "react-datepicker/dist/react-datepicker.css"; // Eliminado porque no se usa

// Estado inicial
type FormState = {
  departamento: string;
  monto: string;
  cuenta_destino: string;
  concepto: string;
  tipo_pago: string;
  frecuencia: string;
  siguiente_fecha: string;
  tipo_cuenta_destino: string;
  tipo_tarjeta: string;
};

const initialState: FormState = {
  departamento: '',
  monto: '',
  cuenta_destino: '',
  concepto: '',
  tipo_pago: '',
  frecuencia: '',
  siguiente_fecha: '',
  tipo_cuenta_destino: 'CLABE',
  tipo_tarjeta: ''
};

type FormAction = { type: 'SET_FIELD'; field: keyof FormState; value: string };
const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
};

// Eliminadas variables no usadas: tipoPagoOptions, departamentos, frecuencias

export default function NuevaRecurrentePage() {
  const router = useRouter();
  const [formData] = useReducer(formReducer, initialState);
  const [loading, setLoading] = useState(false);
  // Eliminado estado no usado: fechaInicio, setFechaInicio

  // handleInputChange eliminado porque no se usa
  // handleSubmit duplicado y bucle innecesario eliminado
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const requiredFields = ['departamento', 'monto', 'cuenta_destino', 'concepto', 'tipo_pago', 'frecuencia', 'siguiente_fecha', 'tipo_cuenta_destino'] as const;
    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.error(`Campo obligatorio faltante: ${field}`);
        setLoading(false);
        return;
      }
    }
    // Validación dinámica de cuenta destino
    const cuenta = formData.cuenta_destino.replace(/[^0-9]/g, '');
    if (formData.tipo_cuenta_destino === 'CLABE' && cuenta.length !== 18) {
      toast.error('La cuenta CLABE debe tener exactamente 18 dígitos.');
      setLoading(false);
      return;
    }
    if (formData.tipo_cuenta_destino === 'Tarjeta' && cuenta.length !== 16) {
      toast.error('La tarjeta debe tener exactamente 16 dígitos.');
      setLoading(false);
      return;
    }
    try {
      // Convertir formData a FormData si el backend espera FormData
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        fd.append(key, value);
      });
      const response = await RecurrentesService.crearRecurrente(fd);
      let successMsg = 'Plantilla recurrente creada exitosamente';
      if (response && typeof response === 'object' && 'message' in response && typeof (response as { message?: string }).message === 'string') {
        successMsg = (response as { message: string }).message;
      }
      toast.success(successMsg);
      router.push('/dashboard/solicitante/mis-recurrentes');
    } catch (error: unknown) {
      console.error('Error:', error);
      let errorMsg = 'Error al crear plantilla recurrente';
      if (typeof error === 'object' && error !== null) {
        const errObj = error as { response?: { data?: { error?: string } } };
        errorMsg = errObj.response?.data?.error || errorMsg;
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  return (
    <ProtectedRoute requiredRoles={['solicitante']}>
      <SolicitanteLayout>
        <div className="max-w-screen-2xl mx-auto px-10 py-12 md:py-20">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-10 md:p-16 mb-12 border border-white/30 w-full text-left shadow-2xl">
            <h1 className="text-4xl font-bold text-white font-montserrat mb-2">Nueva Plantilla Recurrente</h1>
            <p className="text-white/80 text-xl">Completa el formulario para crear una nueva plantilla</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/30 p-10 md:p-16 w-full text-left shadow-2xl">
            <form onSubmit={handleSubmit} className="w-full">
              <div className="flex flex-col md:flex-row gap-10 md:gap-16 w-full items-start">
                {/* Columna Izquierda */}
                <div className="flex-1 space-y-10 w-full md:max-w-[650px]">
                  ...existing code...
                </div>
                {/* Columna Derecha */}
                <div className="flex-1 space-y-10 w-full md:max-w-[650px]">
                  ...existing code...
                </div>
              </div>
              <div className="flex justify-end space-x-10 pt-16">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="bg-gray-600 text-white border-gray-500 hover:bg-gray-700 px-10 py-5 text-lg rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white hover:bg-green-700 px-10 py-5 text-lg rounded-xl shadow"
                >
                  {loading ? 'Guardando...' : 'Crear Plantilla'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}