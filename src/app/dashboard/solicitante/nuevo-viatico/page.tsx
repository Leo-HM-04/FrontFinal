"use client";

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ViaticosService } from '@/services/viaticos.service';
import { FaTrash, FaDownload, FaFileWord, FaClipboardList, FaBolt } from 'react-icons/fa';
import { formatDateForAPI, getCurrentUTC6Date } from '@/utils/dateUtils';

// Si no existe el tipo Viatico, defínelo aquí o impórtalo desde '@/types/viatico'
type Viatico = {
  departamento: string;
  monto: string;
  cuenta_destino: string;
  concepto: string;
  tipo_pago: string;
  tipo_cuenta_destino: string;
  tipo_tarjeta: string;
  banco_destino: string;
  fecha_limite_pago: string;
  viatico_url?: string;
  id_usuario?: string;
  tipo_pago_descripcion?: string;
  nombre_persona: string;
  cuenta: string;
  banco_cuenta: string;
};

type FormState = {
  form: Partial<Viatico>;
  file: File | null;
  mensaje: string;
  errors: Record<string, string>;
};

export default function NuevoViaticoPage() {
  const [formularios, setFormularios] = useState<FormState[]>([
    { form: {}, file: null, mensaje: '', errors: {} }
  ]);
  const [mensajeGlobal, setMensajeGlobal] = useState<string>('');
  const [exito, setExito] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [enviando, setEnviando] = useState<boolean>(false);
  const router = useRouter();

  // Función para obtener la fecha actual en formato YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleChange = (idx: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const nuevos = [...formularios];
    nuevos[idx].form = { ...nuevos[idx].form, [e.target.name]: e.target.value };
    setFormularios(nuevos);
  };

  const handleFile = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const nuevos = [...formularios];
      
      // Validar tipo de archivo
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        nuevos[idx].errors = { 
          ...nuevos[idx].errors, 
          file: 'Tipo de archivo no permitido. Use: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX' 
        };
        e.target.value = ''; // Limpiar el input
        setFormularios(nuevos);
        return;
      }
      
      // Validar tamaño (10MB máximo)
      const maxSize = 10 * 1024 * 1024; // 10MB en bytes
      if (file.size > maxSize) {
        nuevos[idx].errors = { 
          ...nuevos[idx].errors, 
          file: 'El archivo es demasiado grande. Tamaño máximo: 10MB' 
        };
        e.target.value = ''; // Limpiar el input
        setFormularios(nuevos);
        return;
      }
      
      // Si todo está bien, guardar el archivo y limpiar errores
      nuevos[idx].file = file;
      if (nuevos[idx].errors?.file) {
        const { file: _, ...otherErrors } = nuevos[idx].errors;
        nuevos[idx].errors = otherErrors;
      }
      setFormularios(nuevos);
    }
  };

  const bancoOptions = [
    "ACTINVER","AFIRME","albo","ARCUS FI","ASP INTEGRA OPC","AUTOFIN","AZTECA","BaBien","BAJIO","BANAMEX","BANCO COVALTO","BANCOMEXT","BANCOPPEL","BANCO S3","BANCREA","BANJERCITO","BANKAOOL","BANK OF AMERICA","BANK OF CHINA","BANOBRAS","BANORTE","BANREGIO","BANSI","BANXICO","BARCLAYS","BBASE","BBVA MEXICO","BMONEX","CAJA POP MEXICA","CAJA TELEFONIST","CASHI CUENTA","CB INTERCAM","CIBANCO","CI BOLSA","CITI MEXICO","CoDi Valida","COMPARTAMOS","CONSUBANCO","CREDICAPITAL","CREDICLUB","CRISTOBAL COLON","Cuenca","Dep y Pag Dig","DONDE","FINAMEX","FINCOMUN","FINCO PAY","FOMPED","FONDEADORA","FONDO (FIRA)","GBM","HEY BANCO","HIPOTECARIA FED","HSBC","ICBC","INBURSA","INDEVAL","INMOBILIARIO","INTERCAM BANCO","INVEX","JP MORGAN","KLAR","KUSPIT","LIBERTAD","MASARI","Mercado Pago W","MexPago","MIFEL","MIZUHO BANK","MONEXCB","MUFG","MULTIVA BANCO","NAFIN","NU MEXICO","NVIO","PAGATODO","Peibo","PROFUTURO","SABADELL","SANTANDER","SCOTIABANK","SHINHAN","SPIN BY OXXO","STP","TESORED","TRANSFER","UALA","UNAGRA","VALMEX","VALUE","VECTOR","VE POR MAS","VOLKSWAGEN"
  ];

  const handleSubmitTodos = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    const nuevos = [...formularios];
    let huboError = false;

    // Validar todos los formularios antes de enviar
    nuevos.forEach((f, idx) => {
      const errors: Record<string, string> = {};
      // Validar archivo
      if (!f.file) {
        errors.file = 'Adjunta un archivo';
        huboError = true;
      }
      // Solo validar que tenga un valor en cuenta_destino
      if (!f.form.cuenta_destino) {
        errors.cuenta_destino = 'Ingresa el número de cuenta, tarjeta o CLABE';
        huboError = true;
      }
      
      // Validar dígitos de CLABE (18 dígitos exactos)
      if (f.form.tipo_cuenta_destino === 'clabe' && f.form.cuenta_destino) {
        const clabePattern = /^\d{18}$/;
        if (!clabePattern.test(f.form.cuenta_destino)) {
          errors.cuenta_destino = 'La CLABE debe tener exactamente 18 dígitos';
          huboError = true;
        }
      }

      // Validar dígitos de Número de Tarjeta (máximo 16 dígitos)
      if (f.form.tipo_cuenta_destino === 'tarjeta' && f.form.cuenta_destino) {
        const tarjetaPattern = /^\d{1,16}$/;
        if (!tarjetaPattern.test(f.form.cuenta_destino)) {
          errors.cuenta_destino = 'El número de tarjeta debe tener máximo 16 dígitos';
          huboError = true;
        }
      }
      
      if (f.form.tipo_cuenta_destino === 'tarjeta' && !f.form.tipo_tarjeta) {
        errors.tipo_tarjeta = 'Selecciona el tipo de tarjeta';
        huboError = true;
      }
      // Validar campos cuenta y banco_cuenta
      if (f.form.cuenta && f.form.cuenta.trim() !== '' && !f.form.banco_cuenta) {
        errors.banco_cuenta = 'Especifica el banco al que pertenece la cuenta';
        huboError = true;
      }
      nuevos[idx].errors = errors;
    });

    if (huboError) {
      setFormularios(nuevos);
      setMensajeGlobal('Por favor corrige los errores antes de continuar.');
      setExito(false);
      setEnviando(false);
      return;
    }

    // Si no hay errores, proceder con el envío
    await Promise.all(
      nuevos.map(async (f, idx) => {
        try {
          const data = {
            departamento: f.form.departamento || '',
            monto: parseFloat(f.form.monto || '0'),
            cuenta_destino: f.form.cuenta_destino || '',
            concepto: 'Pago a terceros', // Siempre fijo
            tipo_pago: 'viaticos',
            tipo_cuenta_destino: f.form.tipo_cuenta_destino || 'clabe',
            tipo_tarjeta: f.form.tipo_tarjeta || '',
            banco_destino: f.form.banco_destino || '',
            fecha_limite_pago: f.form.fecha_limite_pago || formatDateForAPI(getCurrentUTC6Date()),
            viatico_url: f.file || undefined,
            tipo_pago_descripcion: f.form.tipo_pago_descripcion || '',
            nombre_persona: f.form.nombre_persona || '',
            cuenta: f.form.cuenta || '',
            banco_cuenta: f.form.banco_cuenta || '',
          };
          await ViaticosService.createWithFile(data);
          nuevos[idx].mensaje = 'Viático creado correctamente';
        } catch {
          nuevos[idx].mensaje = 'Error al crear viático';
          huboError = true;
        }
      })
    );
    setFormularios(nuevos);
    if (!huboError) {
      setMensajeGlobal('¡Todos los viáticos fueron creados exitosamente! Redirigiendo...');
      setExito(true);
      setEnviando(false);
      // Scroll al mensaje de éxito
      setTimeout(() => {
        const msg = document.getElementById('mensaje-global-exito');
        if (msg) msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      setTimeout(() => {
        router.push('/dashboard/solicitante/mis-viaticos');
      }, 700);
    } else {
      setMensajeGlobal('Hubo errores al crear algunos viáticos. Revisa los mensajes.');
      setExito(false);
      setEnviando(false);
      
      // Scroll al primer campo con error de dígitos y mostrar toast
      setTimeout(() => {
        // Buscar errores de dígitos específicamente
        const digitErrors = formularios.filter((f) => {
          const error = f.errors?.cuenta_destino;
          return error && (error.includes('dígitos') || error.includes('CLABE'));
        });
        
        if (digitErrors.length > 0) {
          // Encontrar el índice del primer error de dígitos
          const errorIndex = formularios.findIndex((f) => {
            const error = f.errors?.cuenta_destino;
            return error && (error.includes('dígitos') || error.includes('CLABE'));
          });
          
          if (errorIndex >= 0) {
            const targetField = document.querySelector(`input[name="cuenta_destino"]:nth-of-type(${errorIndex + 1})`);
            if (targetField) {
              targetField.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
              (targetField as HTMLElement).focus();
              
              // Mostrar toast con el mensaje de error
              const errorMessage = formularios[errorIndex].errors?.cuenta_destino;
              if (errorMessage) {
                const toast = document.createElement('div');
                toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce';
                toast.textContent = `Viático ${errorIndex + 1}: ${errorMessage}`;
                document.body.appendChild(toast);
                
                setTimeout(() => {
                  if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                  }
                }, 4000);
              }
            }
          }
        }
      }, 100);
    }
  };

  const handleAgregarOtro = () => {
    setFormularios([...formularios, { form: {}, file: null, mensaje: '', errors: {} }]);
  };

  const handleEliminar = (idx: number) => {
    if (formularios.length === 1) return;
    setFormularios(formularios.filter((_, i) => i !== idx));
  };

  // Función para manejar la descarga de la plantilla mejorada
  const handleDescargarPlantilla = async () => {
    try {
      setMensajeGlobal('Generando plantilla mejorada...');
      setExito(true);
      setShowToast(true);
      
      // Generar plantilla HTML mejorada localmente
      const htmlContent = generateImprovedTemplate();
      
      // Crear blob y descarga
      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Solicitud_y_Desglose_de_Viaticos_Mejorada.doc';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Mensaje de éxito
      setMensajeGlobal('¡Plantilla mejorada descargada exitosamente! 📄✨');
      setExito(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      setMensajeGlobal('Error al descargar la plantilla mejorada. Intenta nuevamente.');
      setExito(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // Función para generar la plantilla HTML mejorada
  const generateImprovedTemplate = () => {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitud y Desglose de Viáticos</title>
    <style>
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 30px;
            line-height: 1.4;
            color: #1a1a1a;
            background-color: #f8f9fa;
            position: relative;
        }
        
        /* Marca de agua con logo Bechapra */
        body::after {
            content: '';
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            width: 500px;
            height: 500px;
            background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPCEtLSBMb2dvIEJlY2hhcHJhIC0tPgogIDx0ZXh0IHg9IjI1MCIgeT0iMjAwIiBmb250LWZhbWlseT0iR2VvcmdpYSwgc2VyaWYiIGZvbnQtc2l6ZT0iMTIwIiBmb250LXdlaWdodD0iNzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjM0E3NUJEIiBvcGFjaXR5PSIwLjEiPkI8L3RleHQ+CiAgPHRleHQgeD0iMjUwIiB5PSIzMDAiIGZvbnQtZmFtaWx5PSJHZW9yZ2lhLCBzZXJpZiIgZm9udC1zaXplPSIzNiIgZm9udC13ZWlnaHQ9IjQwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzNBNzVCRCIgb3BhY2l0eT0iMC4wOCI+QmVjaGFwcmE8L3RleHQ+Cjwvc3ZnPgo=');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            z-index: 0;
            pointer-events: none;
        }
        
        .document-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 40px;
            position: relative;
            z-index: 1;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            background: linear-gradient(135deg, #3474eb 0%, #4285f4 100%);
            padding: 30px 20px;
            border-radius: 12px;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+Cjwvc3ZnPg==');
            opacity: 0.1;
            pointer-events: none;
        }
        
        .company-name {
            font-size: 36px;
            font-weight: 300;
            margin-bottom: 10px;
            letter-spacing: 3px;
            font-family: 'Georgia', serif;
            position: relative;
            z-index: 1;
        }
        
        .document-title {
            font-size: 18px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 2px;
            position: relative;
            z-index: 1;
            margin-top: 10px;
        }
        
        .section-header {
            background: linear-gradient(90deg, #3474eb, #4285f4);
            color: white;
            padding: 12px 20px;
            margin: 35px 0 20px 0;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .info-table td {
            border: 1px solid #e1e5e9;
            padding: 15px;
            vertical-align: top;
        }
        
        .label {
            font-weight: 600;
            width: 30%;
            background-color: #f8f9fa;
            color: #495057;
            border-right: 2px solid #3474eb;
        }
        
        .field {
            background-color: white;
            border-bottom: 1px solid #3474eb;
            min-height: 25px;
        }
        
        .expense-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .expense-table th {
            background: linear-gradient(90deg, #3474eb, #4285f4);
            color: white;
            padding: 15px;
            text-align: center;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 13px;
        }
        
        .expense-table td {
            border: 1px solid #e1e5e9;
            padding: 12px 15px;
            vertical-align: middle;
        }
        
        .expense-item {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
        }
        
        .total-row {
            background: linear-gradient(90deg, #fff3cd, #ffeaa7);
            font-weight: 700;
        }
        
        .total-row td {
            border-top: 2px solid #ffc107;
        }
        
        .signature-section {
            margin-top: 40px;
            page-break-inside: avoid;
        }
        
        .signature-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .signature-table td {
            border: 1px solid #e1e5e9;
            padding: 30px 15px;
            text-align: center;
            vertical-align: bottom;
            width: 33.33%;
        }
        
        .signature-title {
            font-weight: 700;
            color: #3474eb;
            margin-bottom: 30px;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 1px;
        }
        
        .signature-line {
            border-bottom: 2px solid #3474eb;
            margin-bottom: 8px;
            height: 25px;
        }
        
        .signature-text {
            font-size: 11px;
            color: #6c757d;
            font-weight: 500;
        }
        
        .checkbox-group {
            display: flex;
            gap: 20px;
            align-items: center;
        }
        
        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
        }
        
        .checkbox {
            width: 15px;
            height: 15px;
            border: 2px solid #3474eb;
            display: inline-block;
        }
        
        .notes-section {
            margin-top: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border-left: 4px solid #ffc107;
            border-radius: 6px;
        }
        
        .notes-title {
            font-weight: 700;
            color: #856404;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
            text-transform: uppercase;
            font-size: 13px;
            letter-spacing: 1px;
        }
        
        .notes-list {
            margin: 0;
            padding-left: 20px;
            color: #856404;
        }
        
        .notes-list li {
            margin-bottom: 8px;
            line-height: 1.5;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 6px;
            border: 1px solid #dee2e6;
        }
        
        .footer-company {
            font-weight: 700;
            color: #3474eb;
            font-size: 14px;
            margin-bottom: 5px;
        }
        
        .footer-text {
            font-size: 11px;
            color: #6c757d;
        }
        
        .icon {
            color: #3474eb;
            font-size: 16px;
        }
        
        @media print {
            body {
                margin: 0;
                background: white;
            }
            .document-container {
                box-shadow: none;
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="document-container">
        <div class="header">
            <div class="company-name">Bechapra</div>
            <div class="document-title">Solicitud y Desglose de Viáticos</div>
        </div>

        <!-- INFORMACIÓN DEL SOLICITANTE -->
        <div class="section-header">
            <i class="fas fa-user icon"></i>
            INFORMACIÓN DEL SOLICITANTE
        </div>
        <table class="info-table">
            <tr>
                <td class="label">Nombre completo:</td>
                <td class="field">_________________________________________________</td>
            </tr>
            <tr>
                <td class="label">Departamento:</td>
                <td class="field">_________________________________________________</td>
            </tr>
            <tr>
                <td class="label">Fecha de solicitud:</td>
                <td class="field">_________________________________________________</td>
            </tr>
            <tr>
                <td class="label">Puesto:</td>
                <td class="field">_________________________________________________</td>
            </tr>
        </table>

        <!-- INFORMACIÓN DEL VIAJE -->
        <div class="section-header">
            <i class="fas fa-plane icon"></i>
            INFORMACIÓN DEL VIAJE
        </div>
        <table class="info-table">
            <tr>
                <td class="label">Destino:</td>
                <td class="field">_________________________________________________</td>
            </tr>
            <tr>
                <td class="label">Fecha de salida:</td>
                <td class="field">_________________________________________________</td>
            </tr>
            <tr>
                <td class="label">Fecha de regreso:</td>
                <td class="field">_________________________________________________</td>
            </tr>
            <tr>
                <td class="label">Duración (días):</td>
                <td class="field">_________________________________________________</td>
            </tr>
            <tr>
                <td class="label">Motivo del viaje:</td>
                <td class="field">_________________________________________________</td>
            </tr>
            <tr>
                <td class="label">Tipo de comisión:</td>
                <td class="field">
                    <div class="checkbox-group">
                        <div class="checkbox-item">
                            <span class="checkbox"></span> Nacional
                        </div>
                        <div class="checkbox-item">
                            <span class="checkbox"></span> Internacional
                        </div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- DESGLOSE DE GASTOS -->
        <div class="section-header">
            <i class="fas fa-money-bill-wave icon"></i>
            DESGLOSE DE GASTOS ESTIMADOS
        </div>
        <table class="expense-table">
            <thead>
                <tr>
                    <th style="width: 60%;">CONCEPTO</th>
                    <th style="width: 40%;">MONTO ESTIMADO (MXN)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><div class="expense-item"><i class="fas fa-bed icon"></i> Hospedaje</div></td>
                    <td class="field">$ ___________________</td>
                </tr>
                <tr>
                    <td><div class="expense-item"><i class="fas fa-utensils icon"></i> Alimentación</div></td>
                    <td class="field">$ ___________________</td>
                </tr>
                <tr>
                    <td><div class="expense-item"><i class="fas fa-car icon"></i> Transporte terrestre</div></td>
                    <td class="field">$ ___________________</td>
                </tr>
                <tr>
                    <td><div class="expense-item"><i class="fas fa-plane icon"></i> Transporte aéreo</div></td>
                    <td class="field">$ ___________________</td>
                </tr>
                <tr>
                    <td><div class="expense-item"><i class="fas fa-gas-pump icon"></i> Combustible</div></td>
                    <td class="field">$ ___________________</td>
                </tr>
                <tr>
                    <td><div class="expense-item"><i class="fas fa-phone icon"></i> Comunicaciones</div></td>
                    <td class="field">$ ___________________</td>
                </tr>
                <tr>
                    <td><div class="expense-item"><i class="fas fa-receipt icon"></i> Otros gastos (especificar):<br/>_________________________</div></td>
                    <td class="field">$ ___________________</td>
                </tr>
                <tr class="total-row">
                    <td><div class="expense-item"><i class="fas fa-calculator icon"></i> <strong>TOTAL ESTIMADO</strong></div></td>
                    <td><strong>$ ___________________</strong></td>
                </tr>
            </tbody>
        </table>

        <!-- INFORMACIÓN BANCARIA -->
        <div class="section-header">
            <i class="fas fa-university icon"></i>
            INFORMACIÓN BANCARIA PARA TRANSFERENCIA
        </div>
        <table class="info-table">
            <tr>
                <td class="label">Nombre del beneficiario:</td>
                <td class="field">_________________________________________________</td>
            </tr>
            <tr>
                <td class="label">Banco:</td>
                <td class="field">_________________________________________________</td>
            </tr>
            <tr>
                <td class="label">CLABE / No. de tarjeta:</td>
                <td class="field">_________________________________________________</td>
            </tr>
            <tr>
                <td class="label">Tipo de cuenta:</td>
                <td class="field">
                    <div class="checkbox-group">
                        <div class="checkbox-item">
                            <span class="checkbox"></span> CLABE
                        </div>
                        <div class="checkbox-item">
                            <span class="checkbox"></span> Tarjeta de débito
                        </div>
                        <div class="checkbox-item">
                            <span class="checkbox"></span> Tarjeta de crédito
                        </div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- JUSTIFICACIÓN -->
        <div class="section-header">
            <i class="fas fa-edit icon"></i>
            JUSTIFICACIÓN DEL VIAJE
        </div>
        <table class="info-table">
            <tr>
                <td class="label">Descripción detallada:</td>
                <td class="field" style="height: 120px; vertical-align: top; padding-top: 15px;">
                    ________________________________________________<br/>
                    ________________________________________________<br/>
                    ________________________________________________<br/>
                    ________________________________________________<br/>
                    ________________________________________________<br/>
                </td>
            </tr>
            <tr>
                <td class="label">Beneficio esperado:</td>
                <td class="field" style="height: 80px; vertical-align: top; padding-top: 15px;">
                    ________________________________________________<br/>
                    ________________________________________________<br/>
                    ________________________________________________<br/>
                </td>
            </tr>
        </table>

        <!-- AUTORIZACIONES -->
        <div class="signature-section">
            <div class="section-header">
                <i class="fas fa-signature icon"></i>
                AUTORIZACIONES
            </div>
            <table class="signature-table">
                <tr>
                    <td>
                        <div class="signature-title">SOLICITANTE</div>
                        <div class="signature-line"></div>
                        <div class="signature-text">Firma y fecha</div>
                    </td>
                    <td>
                        <div class="signature-title">JEFE DIRECTO</div>
                        <div class="signature-line"></div>
                        <div class="signature-text">Firma y fecha</div>
                    </td>
                    <td>
                        <div class="signature-title">DIRECCIÓN GENERAL</div>
                        <div class="signature-line"></div>
                        <div class="signature-text">Firma y fecha</div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- NOTAS IMPORTANTES -->
        <div class="notes-section">
            <div class="notes-title">
                <i class="fas fa-exclamation-triangle"></i>
                NOTAS IMPORTANTES
            </div>
            <ul class="notes-list">
                <li><strong>Anticipación:</strong> Esta solicitud debe ser presentada con al menos <strong>5 días hábiles</strong> de anticipación.</li>
                <li><strong>Comprobantes:</strong> Los comprobantes de gastos deberán ser entregados dentro de los <strong>5 días posteriores</strong> al regreso.</li>
                <li><strong>Excedentes:</strong> Cualquier gasto adicional deberá ser justificado y autorizado por la Dirección General.</li>
                <li><strong>Cancelaciones:</strong> En caso de cancelación del viaje, notificar inmediatamente a Recursos Humanos.</li>
                <li><strong>Reembolsos:</strong> Los gastos no justificados deberán ser reembolsados a la empresa.</li>
                <li><strong>Política:</strong> Este documento está sujeto a las políticas internas de viáticos de la empresa.</li>
            </ul>
        </div>

        <!-- PIE DE PÁGINA -->
        <div class="footer">
            <div class="footer-company">Bechapra</div>
            <div class="footer-text">Solicitud de Viáticos - Documento generado automáticamente - Versión 3.0</div>
        </div>
    </div>
</body>
</html>
    `;
  };

  return (
    <ProtectedRoute requiredRoles={['solicitante']}>
      <SolicitanteLayout>
  <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg px-2 sm:px-4 md:px-8 py-4 sm:py-6 mt-4 sm:mt-6 border border-blue-100">
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-1 sm:mb-2">Nuevo Viático</h1>
            <p className="text-blue-600 text-sm sm:text-base">Completa los campos necesarios para crear tu viático</p>
          </div>

          {/* Sección de Descarga de Plantilla - SENCILLA Y PROFESIONAL */}
          <div className="mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-3 sm:p-6 text-white shadow-lg border border-blue-300">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
                <div className="flex items-center gap-2 sm:gap-4 flex-1">
                  <div className="bg-white/20 p-2 sm:p-3 rounded-lg">
                    <FaFileWord className="text-2xl sm:text-3xl text-white" />
                  </div>
                  <div className="text-center lg:text-left">
                    <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 flex items-center justify-center lg:justify-start gap-1 sm:gap-2">
                      <FaClipboardList className="text-white" /> 
                      <span className="text-white">Plantilla Profesional Mejorada</span>
                    </h3>
                    <p className="text-blue-100 text-xs sm:text-base leading-relaxed">
                      <strong className="text-white">Nueva plantilla completa con formato profesional</strong>, 
                      incluye todos los campos requeridos según estándares empresariales.
                      <br />
                      <small className="text-blue-200">
                        ✨ <strong>Mejoradas:</strong> Información del viaje, desglose detallado de gastos, 
                        justificación, firmas de autorización y notas importantes
                      </small>
                    </p>
                  </div>
                </div>
                
                <div className="flex-shrink-0 w-full lg:w-auto mt-3 lg:mt-0">
                  <button
                    type="button"
                    onClick={handleDescargarPlantilla}
                    className="w-full lg:w-auto bg-white text-blue-600 font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg shadow-md hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <FaDownload className="text-base sm:text-lg" />
                    <span>Descargar Plantilla Mejorada</span>
                  </button>
                </div>
              </div>
              
              <div className="mt-3 sm:mt-4 text-center">
                <div className="inline-flex items-center bg-white/10 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
                  <FaBolt className="mr-1 sm:mr-2 text-yellow-200" />
                  <span className="font-medium text-white">¡NUEVA VERSIÓN!</span>
                  <span className="ml-1 sm:ml-2 text-blue-100">Plantilla profesional con desglose completo, información del viaje y autorizaciones</span>
                </div>
              </div>
            </div>
          </div>
          {showToast && (
            <div
              className={`fixed top-6 right-6 z-[9999] flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg border text-sm font-semibold transition-all duration-300
                ${exito ? 'bg-green-50 border-green-400 text-green-800' : 'bg-red-50 border-red-400 text-red-800'}`}
              style={{ minWidth: 0, maxWidth: 320 }}
            >
              {exito ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6M9 9l6 6" /></svg>
              )}
              <span>{mensajeGlobal}</span>
            </div>
          )}
          <form onSubmit={handleSubmitTodos}>
            {formularios.map((f, idx) => (
              <div
                key={idx}
                className="relative mb-3 sm:mb-4 border border-blue-200 bg-blue-50/30 rounded-xl p-2 sm:p-4 md:p-6"
              >
                {/* Identificador simple */}
                <div className="absolute -top-3 left-4 bg-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                  Viático {idx + 1}
                </div>
                {formularios.length > 1 && (
                  <button
                    type="button"
                    title="Eliminar este formulario"
                    onClick={() => handleEliminar(idx)}
                    className="text-red-600 absolute top-2 right-4 flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-sm font-medium"
                  >
                    <FaTrash className="w-3 h-3" /> Eliminar
                  </button>
                )}
                
                {/* Campos organizados en grid simple */}
                <div className="mt-2 sm:mt-4 space-y-3 sm:space-y-4">
                  {/* Primera fila: Datos bancarios */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-900 font-medium text-sm">Tipo de Cuenta *</label>
                      <select name="tipo_cuenta_destino" onChange={e => {
                        const nuevos = [...formularios];
                        nuevos[idx].form = { ...nuevos[idx].form, [e.target.name]: e.target.value, cuenta_destino: '', tipo_tarjeta: e.target.value === 'tarjeta' ? '' : undefined };
                        nuevos[idx].errors = {};
                        setFormularios(nuevos);
                      }} required className="input input-bordered text-black text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400" defaultValue="">
                        <option value="" disabled>Selecciona una opción</option>
                        <option value="clabe">CLABE</option>
                        <option value="tarjeta">Número de Tarjeta</option>
                      </select>
                      {formularios[idx].errors?.tipo_cuenta_destino && (<span className="text-red-600 text-xs">{formularios[idx].errors.tipo_cuenta_destino}</span>)}
                    </div>
                    
                    {formularios[idx].form.tipo_cuenta_destino === 'tarjeta' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-blue-900 font-medium text-sm">Tipo de Tarjeta *</label>
                        <select name="tipo_tarjeta" onChange={e => handleChange(idx, e)} className="input input-bordered text-black text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400" defaultValue="" required>
                          <option value="" disabled>Tipo de tarjeta</option>
                          <option value="debito">DÉBITO</option>
                          <option value="credito">CRÉDITO</option>
                        </select>
                        {formularios[idx].errors?.tipo_tarjeta && (<span className="text-red-600 text-xs">{formularios[idx].errors.tipo_tarjeta}</span>)}
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-900 font-medium text-sm">Cuenta Destino *</label>
                      <input 
                        name="cuenta_destino" 
                        placeholder={formularios[idx].form.tipo_cuenta_destino === 'tarjeta' ? 'Número de tarjeta' : 'Número de cuenta CLABE'} 
                        value={formularios[idx].form.cuenta_destino || ''} 
                        pattern={
                          formularios[idx].form.tipo_cuenta_destino === 'clabe' ? '[0-9]{18}' : 
                          formularios[idx].form.tipo_cuenta_destino === 'tarjeta' ? '[0-9]{1,16}' : 
                          undefined
                        }
                        maxLength={
                          formularios[idx].form.tipo_cuenta_destino === 'clabe' ? 18 : 
                          formularios[idx].form.tipo_cuenta_destino === 'tarjeta' ? 16 : 
                          undefined
                        }
                        onChange={e => {
                        const value = e.target.value;
                        const nuevos = [...formularios];
                        nuevos[idx].form = { ...nuevos[idx].form, cuenta_destino: value };
                        
                        // Validar en tiempo real según el tipo de cuenta
                        if (!value) {
                          nuevos[idx].errors = { ...nuevos[idx].errors, cuenta_destino: 'Campo requerido' };
                        } else {
                          const errorsObj = { ...(nuevos[idx].errors || {}) };
                          
                          // Validar dígitos según el tipo
                          if (formularios[idx].form.tipo_cuenta_destino === 'clabe') {
                            const clabePattern = /^\d{18}$/;
                            if (!clabePattern.test(value) && value.length <= 18) {
                              delete errorsObj.cuenta_destino;
                            } else if (!clabePattern.test(value) && value.length > 18) {
                              errorsObj.cuenta_destino = 'La CLABE debe tener exactamente 18 dígitos';
                            }
                          } else if (formularios[idx].form.tipo_cuenta_destino === 'tarjeta') {
                            const tarjetaPattern = /^\d{1,16}$/;
                            if (!tarjetaPattern.test(value)) {
                              errorsObj.cuenta_destino = 'El número de tarjeta debe tener máximo 16 dígitos';
                            } else {
                              delete errorsObj.cuenta_destino;
                            }
                          } else {
                            delete errorsObj.cuenta_destino;
                          }
                          
                          nuevos[idx].errors = errorsObj;
                        }
                        setFormularios(nuevos);
                      }} required className={`text-black input input-bordered text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400 font-mono ${formularios[idx].errors?.cuenta_destino ? 'border-red-400' : ''}`} />
                      
                      {/* Texto de ayuda para requisitos de dígitos */}
                      {formularios[idx].form.tipo_cuenta_destino && (
                        <div className="mt-1">
                          {formularios[idx].form.tipo_cuenta_destino === 'clabe' && (
                            <p className="text-blue-600 text-xs flex items-center">
                              <span className="mr-1">💡</span>
                              La CLABE debe tener exactamente 18 dígitos
                            </p>
                          )}
                          {formularios[idx].form.tipo_cuenta_destino === 'tarjeta' && (
                            <p className="text-blue-600 text-xs flex items-center">
                              <span className="mr-1">💳</span>
                              El número de tarjeta debe tener máximo 16 dígitos
                            </p>
                          )}
                        </div>
                      )}
                      
                      {formularios[idx].errors?.cuenta_destino && (<span className="text-red-600 text-xs">{formularios[idx].errors.cuenta_destino}</span>)}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-900 font-medium text-sm">Banco Destino *</label>
                      <select name="banco_destino" value={formularios[idx].form.banco_destino || ''} onChange={e => handleChange(idx, e)} required className="input input-bordered text-black text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400">
                        <option value="" disabled>Selecciona banco</option>
                        {bancoOptions.map(banco => (
                          <option key={banco} value={banco}>{banco}</option>
                        ))}
                      </select>
                      {formularios[idx].errors?.banco_destino && (<span className="text-red-600 text-xs">{formularios[idx].errors.banco_destino}</span>)}
                    </div>
                  </div>
                  
                  {/* Cuenta adicional (opcional) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 p-2 sm:p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <div className="flex flex-col gap-1">
                      <label className="text-green-800 font-medium text-sm">No. De Cuenta  (opcional)</label>
                      <input 
                        name="cuenta" 
                        placeholder="No. De Cuenta" 
                        value={formularios[idx].form.cuenta || ''} 
                        onChange={e => handleChange(idx, e)} 
                        className="text-black input input-bordered text-sm px-3 py-2 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-400" 
                      />
                    </div>
                    
                    {formularios[idx].form.cuenta && formularios[idx].form.cuenta.trim() !== '' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-green-800 font-medium text-sm">Banco de la Cuenta *</label>
                        <select 
                          name="banco_cuenta" 
                          value={formularios[idx].form.banco_cuenta || ''} 
                          onChange={e => handleChange(idx, e)} 
                          required
                          className="text-black input input-bordered text-sm px-3 py-2 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-400" 
                        >
                          <option value="" disabled>Selecciona banco</option>
                          {bancoOptions.map(banco => (
                            <option key={banco} value={banco}>{banco}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  
                  {/* Segunda fila: Datos del pago */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-900 font-medium text-sm">Monto *</label>
                      <input name="monto" placeholder="0.00" type="number" onChange={e => handleChange(idx, e)} required className="text-black input input-bordered text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400" />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-900 font-medium text-sm">Departamento *</label>
                      <select name="departamento" onChange={e => handleChange(idx, e)} required className="text-black input input-bordered text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400" defaultValue="">
                        <option value="" disabled>Selecciona departamento</option>
                        <option value="contabilidad">CONTABILIDAD</option>
                        <option value="facturacion">FACTURACIÓN</option>
                        <option value="cobranza">COBRANZA</option>
                        <option value="vinculacion">VINCULACIÓN</option>
                        <option value="administracion">ADMINISTRACIÓN</option>
                        <option value="ti">TI</option>
                        <option value="automatizaciones">AUTOMATIZACIONES</option>
                        <option value="comercial">COMERCIAL</option>
                        <option value="atencion a clientes">ATENCIÓN A CLIENTES</option>
                        <option value="tesoreria">TESORERÍA</option>
                        <option value="nomina">NÓMINA</option>
                        <option value="atraccion de talento">ATRACCIÓN DE TALENTO</option>
                        <option value="direccion general">DIRECCIÓN GENERAL</option>
                      </select>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-900 font-medium text-sm">Fecha Límite *</label>
                      <input
                        name="fecha_limite_pago"
                        type="date"
                        min={getTodayDate()}
                        onChange={e => handleChange(idx, e)}
                        required
                        className="text-black input input-bordered text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400"
                        onFocus={e => e.target.showPicker && e.target.showPicker()}
                      />
                    </div>
                  </div>
                  
                  {/* Tercera fila: Beneficiario y descripción */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-900 font-medium text-sm">Nombre del Beneficiario *</label>
                      <input name="nombre_persona" placeholder="Nombre completo" onChange={e => handleChange(idx, e)} required className="text-black input input-bordered text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400" />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-900 font-medium text-sm">Descripción del viático (opcional)</label>
                      <input name="tipo_pago_descripcion" placeholder="Descripción del uso o destino del viático" onChange={e => handleChange(idx, e)} className="text-black input input-bordered text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                  
                  {/* Archivo */}
                  <div className="flex flex-col gap-1">
                    <label className="text-blue-900 font-medium text-sm">Archivo Comprobante *</label>
                    <input 
                      type="file" 
                      name="viatico_url" 
                      onChange={e => handleFile(idx, e)} 
                      required 
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls"
                      className="file-input file-input-bordered text-sm px-3 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400 text-blue-900 bg-white" 
                    />
                    <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                      <p className="text-blue-600 text-xs flex items-center">
                        <span className="mr-1">📎</span>
                        Formatos: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX
                      </p>
                      <p className="text-blue-600 text-xs flex items-center mt-1 sm:mt-0">
                        <span className="mr-1">⚖️</span>
                        Máx: 10MB
                      </p>
                    </div>
                    {formularios[idx].errors?.file && (<span className="text-red-600 text-xs">{formularios[idx].errors.file}</span>)}
                  </div>
                  
                  {/* Concepto fijo */}
                  <input name="concepto" value="Pago a terceros" readOnly hidden />
                  <input name="tipo_pago" value="viaticos" readOnly hidden />
                  {f.mensaje && <div className="text-center text-red-800 font-medium mt-3 p-2 bg-red-50 rounded-lg">{f.mensaje}</div>}
                  <input name="tipo_pago" value="viaticos" readOnly hidden />
                </div>
              </div>
            ))}
            
            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-4 mt-4 sm:mt-6 pt-3 sm:pt-6 border-t border-blue-200">
              <button
                type="button"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-blue-600 text-blue-700 font-medium hover:bg-blue-50 transition-colors text-sm sm:text-base"
                onClick={handleAgregarOtro}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar Otro Viático
              </button>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-gray-400 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  onClick={() => router.push('/dashboard/solicitante/mis-viaticos')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`w-full sm:w-auto flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors ${enviando ? 'opacity-60 pointer-events-none' : ''}`}
                  disabled={enviando}
                >
                  {enviando ? (
                    <>
                      <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Crear Todos los Viáticos
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}
