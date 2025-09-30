// Script para depurar por qué el formulario TUKASH aparece vacío
// Consulta la solicitud y muestra el campo plantilla_datos

const pool = require('../BackFinal/db/connection');
const solicitudId = 251; // Cambia por el ID que estás probando

async function debugPlantillaDatos() {
  try {
    const [rows] = await pool.query('SELECT plantilla_datos FROM solicitudes_pago WHERE id_solicitud = ?', [solicitudId]);
    if (rows.length === 0) {
      console.log('No se encontró la solicitud.');
      return;
    }
    const datos = rows[0].plantilla_datos;
    console.log('plantilla_datos:', datos);
    if (datos) {
      try {
        const obj = typeof datos === 'string' ? JSON.parse(datos) : datos;
        console.log('Datos parseados:', obj);
      } catch (err) {
        console.error('Error parseando plantilla_datos:', err);
      }
    } else {
      console.log('El campo plantilla_datos está vacío o es null.');
    }
  } catch (err) {
    console.error('Error consultando la solicitud:', err);
  }
}

debugPlantillaDatos();
