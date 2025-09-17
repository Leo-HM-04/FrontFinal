import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // HTML mejorado para la plantilla de viáticos basado en el PDF
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitud y Desglose de Viáticos</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.4;
            color: #333;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        
        .document-title {
            font-size: 20px;
            font-weight: bold;
            color: #1e40af;
            text-decoration: underline;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            background-color: #dbeafe;
            padding: 8px;
            margin: 30px 0 15px 0;
            border-left: 4px solid #2563eb;
        }
        
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        
        .info-table td, .info-table th {
            border: 1px solid #d1d5db;
            padding: 12px 8px;
            text-align: left;
        }
        
        .info-table th {
            background-color: #f3f4f6;
            font-weight: bold;
        }
        
        .label {
            font-weight: bold;
            width: 30%;
            background-color: #f9fafb;
        }
        
        .underline-field {
            border-bottom: 1px solid #000;
            min-width: 200px;
            display: inline-block;
            margin-left: 10px;
        }
        
        .expense-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        
        .expense-table th {
            background-color: #1e40af;
            color: white;
            padding: 12px;
            text-align: center;
            font-weight: bold;
        }
        
        .expense-table td {
            border: 1px solid #d1d5db;
            padding: 10px;
            text-align: left;
        }
        
        .total-row {
            background-color: #fef3c7;
            font-weight: bold;
        }
        
        .signatures {
            margin-top: 50px;
        }
        
        .signature-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .signature-table td {
            border: 1px solid #d1d5db;
            padding: 40px 20px;
            text-align: center;
            vertical-align: bottom;
            width: 33.33%;
        }
        
        .signature-line {
            border-bottom: 1px solid #000;
            margin-bottom: 5px;
            height: 20px;
        }
        
        .checkbox {
            margin-right: 10px;
        }
        
        .notes {
            margin-top: 30px;
            padding: 15px;
            background-color: #fef9e7;
            border-left: 4px solid #f59e0b;
        }
        
        .notes h3 {
            margin-top: 0;
            color: #92400e;
        }
        
        .notes ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        
        .notes li {
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">BECHARA SOLUTIONS</div>
        <div class="document-title">SOLICITUD Y DESGLOSE DE VIÁTICOS</div>
    </div>

    <!-- INFORMACIÓN DEL SOLICITANTE -->
    <div class="section-title">📋 INFORMACIÓN DEL SOLICITANTE</div>
    <table class="info-table">
        <tr>
            <td class="label">Nombre completo:</td>
            <td>_________________________________________________</td>
        </tr>
        <tr>
            <td class="label">Departamento:</td>
            <td>_________________________________________________</td>
        </tr>
        <tr>
            <td class="label">Fecha de solicitud:</td>
            <td>_________________________________________________</td>
        </tr>
        <tr>
            <td class="label">Puesto:</td>
            <td>_________________________________________________</td>
        </tr>
    </table>

    <!-- INFORMACIÓN DEL VIAJE -->
    <div class="section-title">✈️ INFORMACIÓN DEL VIAJE</div>
    <table class="info-table">
        <tr>
            <td class="label">Destino:</td>
            <td>_________________________________________________</td>
        </tr>
        <tr>
            <td class="label">Fecha de salida:</td>
            <td>_________________________________________________</td>
        </tr>
        <tr>
            <td class="label">Fecha de regreso:</td>
            <td>_________________________________________________</td>
        </tr>
        <tr>
            <td class="label">Duración (días):</td>
            <td>_________________________________________________</td>
        </tr>
        <tr>
            <td class="label">Motivo del viaje:</td>
            <td>_________________________________________________</td>
        </tr>
        <tr>
            <td class="label">Tipo de comisión:</td>
            <td>
                <span class="checkbox">☐</span> Nacional &nbsp;&nbsp;&nbsp;
                <span class="checkbox">☐</span> Internacional
            </td>
        </tr>
    </table>

    <!-- DESGLOSE DE GASTOS -->
    <div class="section-title">💰 DESGLOSE DE GASTOS ESTIMADOS</div>
    <table class="expense-table">
        <thead>
            <tr>
                <th style="width: 60%;">CONCEPTO</th>
                <th style="width: 40%;">MONTO ESTIMADO (MXN)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>🏨 Hospedaje</td>
                <td>$ ___________________</td>
            </tr>
            <tr>
                <td>🍽️ Alimentación</td>
                <td>$ ___________________</td>
            </tr>
            <tr>
                <td>🚗 Transporte terrestre</td>
                <td>$ ___________________</td>
            </tr>
            <tr>
                <td>✈️ Transporte aéreo</td>
                <td>$ ___________________</td>
            </tr>
            <tr>
                <td>⛽ Combustible</td>
                <td>$ ___________________</td>
            </tr>
            <tr>
                <td>📱 Comunicaciones</td>
                <td>$ ___________________</td>
            </tr>
            <tr>
                <td>📄 Otros gastos (especificar):<br/>_________________________</td>
                <td>$ ___________________</td>
            </tr>
            <tr class="total-row">
                <td><strong>💵 TOTAL ESTIMADO</strong></td>
                <td><strong>$ ___________________</strong></td>
            </tr>
        </tbody>
    </table>

    <!-- INFORMACIÓN BANCARIA -->
    <div class="section-title">🏦 INFORMACIÓN BANCARIA PARA TRANSFERENCIA</div>
    <table class="info-table">
        <tr>
            <td class="label">Nombre del beneficiario:</td>
            <td>_________________________________________________</td>
        </tr>
        <tr>
            <td class="label">Banco:</td>
            <td>_________________________________________________</td>
        </tr>
        <tr>
            <td class="label">CLABE / No. de tarjeta:</td>
            <td>_________________________________________________</td>
        </tr>
        <tr>
            <td class="label">Tipo de cuenta:</td>
            <td>
                <span class="checkbox">☐</span> CLABE &nbsp;&nbsp;&nbsp;
                <span class="checkbox">☐</span> Tarjeta de débito &nbsp;&nbsp;&nbsp;
                <span class="checkbox">☐</span> Tarjeta de crédito
            </td>
        </tr>
    </table>

    <!-- JUSTIFICACIÓN -->
    <div class="section-title">📝 JUSTIFICACIÓN DEL VIAJE</div>
    <table class="info-table">
        <tr>
            <td class="label" style="width: 20%;">Descripción detallada:</td>
            <td style="height: 100px; vertical-align: top;">
                <br/>
                ________________________________________________<br/>
                ________________________________________________<br/>
                ________________________________________________<br/>
                ________________________________________________<br/>
            </td>
        </tr>
        <tr>
            <td class="label">Beneficio esperado:</td>
            <td>
                <br/>
                ________________________________________________<br/>
                ________________________________________________<br/>
            </td>
        </tr>
    </table>

    <!-- SECCIÓN DE FIRMAS -->
    <div class="signatures">
        <div class="section-title">✅ AUTORIZACIONES</div>
        <table class="signature-table">
            <tr>
                <td>
                    <strong>SOLICITANTE</strong><br/><br/><br/>
                    <div class="signature-line"></div>
                    Firma y fecha
                </td>
                <td>
                    <strong>JEFE DIRECTO</strong><br/><br/><br/>
                    <div class="signature-line"></div>
                    Firma y fecha
                </td>
                <td>
                    <strong>DIRECCIÓN GENERAL</strong><br/><br/><br/>
                    <div class="signature-line"></div>
                    Firma y fecha
                </td>
            </tr>
        </table>
    </div>

    <!-- NOTAS IMPORTANTES -->
    <div class="notes">
        <h3>⚠️ NOTAS IMPORTANTES:</h3>
        <ul>
            <li><strong>Anticipación:</strong> Esta solicitud debe ser presentada con al menos <strong>5 días hábiles</strong> de anticipación.</li>
            <li><strong>Comprobantes:</strong> Los comprobantes de gastos deberán ser entregados dentro de los <strong>5 días posteriores</strong> al regreso.</li>
            <li><strong>Excedentes:</strong> Cualquier gasto adicional deberá ser justificado y autorizado por la Dirección General.</li>
            <li><strong>Cancelaciones:</strong> En caso de cancelación del viaje, notificar inmediatamente a Recursos Humanos.</li>
            <li><strong>Reembolsos:</strong> Los gastos no justificados deberán ser reembolsados a la empresa.</li>
            <li><strong>Política:</strong> Este documento está sujeto a las políticas internas de viáticos de la empresa.</li>
        </ul>
    </div>

    <!-- PIE DE PÁGINA -->
    <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280;">
        <p><strong>BECHARA SOLUTIONS</strong> - Solicitud de Viáticos</p>
        <p>Documento generado automáticamente - Versión 2.0</p>
    </div>
</body>
</html>
    `.trim();

    // Crear headers para que se descargue como archivo Word
    const headers = new Headers({
      'Content-Type': 'application/msword',
      'Content-Disposition': 'attachment; filename="Solicitud_y_Desglose_de_Viaticos_Mejorada.doc"',
    });

    return new NextResponse(htmlContent, { 
      status: 200,
      headers 
    });

  } catch (error) {
    console.error('Error generando plantilla:', error);
    return NextResponse.json(
      { error: 'Error al generar la plantilla' },
      { status: 500 }
    );
  }
}