// Tipos para el sistema de plantillas de solicitudes

export type TipoCampo = 
  | 'texto'
  | 'numero'
  | 'moneda'
  | 'email'
  | 'telefono'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'archivo'
  | 'fecha'
  | 'cuenta_clabe'
  | 'banco';

export type ValidacionCampo = {
  requerido?: boolean;
  minLength?: number;
  maxLength?: number;
  patron?: string;
  mensaje?: string;
  longitudExacta?: number;
  soloNumeros?: boolean;
};

export type OpcionCampo = {
  valor: string;
  etiqueta: string;
  descripcion?: string;
};

export type CampoPlantilla = {
  id: string;
  nombre: string;
  tipo: TipoCampo;
  etiqueta: string;
  placeholder?: string;
  ayuda?: string;
  valorPorDefecto?: string | number | boolean | string[] | File[];
  opciones?: OpcionCampo[];
  validaciones?: ValidacionCampo;
  dependencias?: {
    campo: string;
    valor: string | number | boolean;
    accion: 'mostrar' | 'ocultar' | 'requerir';
  }[];
  estilos?: {
    ancho?: 'completo' | 'medio' | 'tercio' | 'cuarto';
    orden?: number;
    soloLectura?: boolean;
  };
};

export type SeccionPlantilla = {
  id: string;
  titulo: string;
  descripcion?: string;
  campos: CampoPlantilla[];
  estilos?: {
    columnas?: number;
    espaciado?: 'compacto' | 'normal' | 'amplio';
  };
};

export type PlantillaSolicitud = {
  id: string;
  nombre: string;
  descripcion: string;
  version: string;
  activa: boolean;
  icono?: string;
  color?: string;
  categoria?: string;
  secciones: SeccionPlantilla[];
  configuracion?: {
    permiteArchivosMultiples?: boolean;
    tiposArchivosPermitidos?: string[];
    tamanoMaximoArchivo?: number;
    mostrarProgreso?: boolean;
  };
  metadatos?: {
    creadoPor?: string;
    fechaCreacion?: string;
    fechaModificacion?: string;
    usosFrecuentes?: number;
  };
};

export type DatosFormularioPlantilla = Record<string, unknown>;

export type EstadoPlantilla = {
  plantillaSeleccionada: PlantillaSolicitud | null;
  datos: DatosFormularioPlantilla;
  errores: { [campoId: string]: string };
  camposVisibles: Set<string>;
  cargando: boolean;
};
