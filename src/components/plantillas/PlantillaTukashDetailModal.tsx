'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { SolicitudesService } from '@/services/solicitudes.service';
import { Comprobante } from '@/types';
import Image from 'next/image';
import { X, FileText, ExternalLink } from 'lucide-react';
import { PlantillaTukashModalProps, LoadingStateTukash, ErrorStateTukash } from '@/types/plantillaTukash';
// import { SolicitudTukashData } from '@/types/plantillaTukash'; // Removed unused import
import { SolicitudArchivosService, SolicitudArchivo } from '@/services/solicitudArchivos.service';


// Helpers (reuse from other modals if needed)

// Helpers and UI components (inlined from PlantillaSuaInternasDetailModal)
const formatCurrency = (amount: number | string): string => {
	const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
	if (isNaN(numAmount)) return '$0.00 MXN';
	return new Intl.NumberFormat('es-MX', {
		style: 'currency',
		currency: 'MXN',
		minimumFractionDigits: 2
	}).format(numAmount);
};

const formatDate = (dateString: string): string => {
	if (!dateString) return 'No especificada';
	const date = new Date(dateString);
	return date.toLocaleDateString('es-MX', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
};

const InfoField: React.FC<{
	label: string;
	value: string | number | null | undefined;
	variant?: 'default' | 'currency' | 'mono' | 'date' | 'estado';
	className?: string;
}> = ({ label, value, variant = 'default', className = '' }) => {
	const formatValue = () => {
		if (value === null || value === undefined || value === '') {
			return 'No especificado';
		}
		switch (variant) {
			case 'currency':
				return formatCurrency(value);
			case 'date':
				return formatDate(value.toString());
			case 'mono':
				return value.toString();
			case 'estado':
				return (
					<span className={`px-2 py-1 rounded-lg border text-xs font-semibold ${getEstadoColor(value.toString())}`}>{value}</span>
				);
			default:
				return value.toString();
		}
	};
	const getValueClassName = () => {
		let baseClass = 'text-gray-900 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200';
		if (variant === 'mono') baseClass += ' font-mono text-sm';
		if (variant === 'currency') baseClass += ' font-semibold text-green-700';
		if (variant === 'estado') baseClass += ' p-0 border-0 bg-transparent';
		return baseClass;
	};
	return (
		<div className={`space-y-2 ${className}`}>
			<label className="block text-sm font-semibold text-blue-800">{label}</label>
			<div className={getValueClassName()}>{formatValue()}</div>
		</div>
	);
};

const getEstadoColor = (estado: string) => {
	switch ((estado || '').toLowerCase()) {
		case 'aprobada':
			return 'bg-green-100 text-green-800 border-green-300';
		case 'rechazada':
			return 'bg-red-100 text-red-800 border-red-300';
		case 'pagada':
			return 'bg-blue-100 text-blue-800 border-blue-300';
		default:
			return 'bg-yellow-100 text-yellow-800 border-yellow-300';
	}
};

const buildFileUrl = (rutaArchivo: string): string => {
	// Always use the standardized comprobante URL pattern
	if (!rutaArchivo) return '';
	const fileName = rutaArchivo.split('/').pop();
	return `https://bechapra.com.mx/uploads/comprobantes/${fileName}`;
};

const FilePreview: React.FC<{ archivo: SolicitudArchivo }> = ({ archivo }) => {
	const [imageError, setImageError] = useState(false);
	if (!archivo.archivo_url) {
		return (
			<div className="text-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
				<FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
				<p className="text-sm text-gray-500">Archivo no disponible</p>
			</div>
		);
	}
	const fileUrl = buildFileUrl(archivo.archivo_url);
	const extension = archivo.archivo_url?.split('.').pop()?.toLowerCase() || '';
	const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
	const isPdf = extension === 'pdf';
	const getFileName = () => {
		const urlParts = archivo.archivo_url.split('/');
		const fileName = urlParts[urlParts.length - 1];
		return fileName || `Archivo ${archivo.id}`;
	};
	if (isPdf) {
		return (
			<div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
				<div className="w-full rounded border border-blue-200 overflow-hidden shadow-sm bg-white">
					<iframe src={fileUrl} title={getFileName()} className="w-full" style={{ height: '200px' }} />
					<div className="bg-blue-50/80 p-2 text-xs text-center text-blue-700">
						Vista previa limitada • Haga clic en &quot;Ver completo&quot; para el PDF completo
					</div>
				</div>
				<div className="p-4">
					<p className="text-sm font-semibold text-gray-900 truncate mb-1">{getFileName()}</p>
					<p className="text-xs text-gray-500 mb-3">Documento PDF</p>
					<a href={fileUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
						<ExternalLink className="w-4 h-4" />Ver completo
					</a>
				</div>
			</div>
		);
	}
	return (
		<div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
			<div className="relative h-40 bg-gray-50 flex items-center justify-center">
				{isImage && !imageError ? (
					<Image src={fileUrl} alt="Preview del archivo" width={150} height={150} className="object-contain max-h-full max-w-full rounded" onError={() => setImageError(true)} />
				) : (
					<div className="text-center">
						<div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
							<FileText className="w-8 h-8 text-blue-600" />
						</div>
						<p className="text-xs text-gray-600 font-medium">{isPdf ? 'PDF' : isImage ? 'Imagen' : 'Archivo'}</p>
					</div>
				)}
			</div>
			<div className="p-4">
				<p className="text-sm font-semibold text-gray-900 truncate mb-1">{getFileName()}</p>
				<p className="text-xs text-gray-500 mb-3">{archivo.tipo || 'Archivo'}</p>
				<a href={fileUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
					<ExternalLink className="w-4 h-4" />Ver completo
				</a>
			</div>
		</div>
	);
};

export function PlantillaTukashDetailModal({ solicitud, isOpen, onClose }: PlantillaTukashModalProps) {
	const [archivos, setArchivos] = useState<SolicitudArchivo[]>([]);
	const [loading, setLoading] = useState<LoadingStateTukash>({ archivos: false, general: false });
	const [errors, setErrors] = useState<ErrorStateTukash>({ archivos: null, general: null });
	const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
	const [loadingComprobantes, setLoadingComprobantes] = useState(false);
	const [errorComprobantes, setErrorComprobantes] = useState<string | null>(null);

	// Fetch archivos adjuntos
		const fetchArchivos = useCallback(async () => {
			if (!solicitud?.id_solicitud) return;
			setLoading((prev) => ({ ...prev, archivos: true }));
			setErrors((prev) => ({ ...prev, archivos: null }));
			try {
				const archivosRes = await SolicitudArchivosService.obtenerArchivos(solicitud.id_solicitud);
				setArchivos(archivosRes);
			} catch {
				setErrors((prev) => ({ ...prev, archivos: 'Error al cargar archivos adjuntos' }));
			} finally {
				setLoading((prev) => ({ ...prev, archivos: false }));
			}
		}, [solicitud?.id_solicitud]);

	// Fetch comprobantes de pago
	const fetchComprobantes = useCallback(async () => {
		if (!solicitud?.id_solicitud) return;
		setLoadingComprobantes(true);
		setErrorComprobantes(null);
		try {
			const comprobantesRes = await SolicitudesService.getComprobantes(solicitud.id_solicitud);
			setComprobantes(comprobantesRes);
		} catch {
			setErrorComprobantes('Error al cargar comprobantes de pago');
		} finally {
			setLoadingComprobantes(false);
		}
	}, [solicitud?.id_solicitud]);

	useEffect(() => {
		if (isOpen && solicitud) {
			fetchArchivos();
			fetchComprobantes();
		}
	}, [isOpen, solicitud, fetchArchivos, fetchComprobantes]);

	// Reset states on close
	useEffect(() => {
		if (!isOpen) {
			setArchivos([]);
			setLoading({ archivos: false, general: false });
			setErrors({ archivos: null, general: null });
			setComprobantes([]);
			setLoadingComprobantes(false);
			setErrorComprobantes(null);
		}
	}, [isOpen]);

	// Escape key handler
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		};
		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
			document.body.style.overflow = 'hidden';
		}
		return () => {
			document.removeEventListener('keydown', handleEscape);
			document.body.style.overflow = '';
		};
	}, [isOpen, onClose]);

	if (!isOpen || !solicitud) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-blue-900/60 backdrop-blur-sm">
			{/* Overlay */}
			<div
				className="absolute inset-0"
				onClick={onClose}
				role="button"
				tabIndex={-1}
				aria-label="Cerrar modal"
			/>
			{/* Modal container */}
			<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col border border-blue-100">
				{/* Close button */}
				<button
					onClick={onClose}
					className="absolute top-3 right-3 z-30 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-red-600 border border-blue-200 hover:border-red-300 rounded-full p-2 shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
					aria-label="Cerrar modal"
				>
					<X className="w-6 h-6" />
				</button>
				{/* Content */}
				<div className="flex-1 flex flex-col lg:flex-row overflow-y-auto">
					{/* Left: Main info and comprobantes */}
					<div className="flex-1 min-w-0 p-6 flex flex-col gap-6 border-r border-blue-100">
						{/* Main info */}
						<div>
							<h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Información Principal</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<InfoField label="Asunto" value={solicitud.asunto} className="md:col-span-2" />
								<InfoField label="Cliente" value={solicitud.cliente} />
								<InfoField label="Beneficiario Tarjeta" value={solicitud.beneficiario_tarjeta} />
								<InfoField label="Número Tarjeta" value={solicitud.numero_tarjeta} />
								<InfoField label="Monto Cliente" value={solicitud.monto_total_cliente} variant="currency" />
								<InfoField label="Monto Tukash" value={solicitud.monto_total_tukash} variant="currency" />
								<InfoField label="Estado" value={solicitud.estado} variant="estado" />
								<InfoField label="Folio" value={solicitud.folio} />
								<InfoField label="Fecha Creación" value={solicitud.fecha_creacion} variant="date" />
								<InfoField label="Fecha Actualización" value={solicitud.fecha_actualizacion} variant="date" />
								<InfoField label="Usuario Creación" value={solicitud.usuario_creacion} />
								<InfoField label="Usuario Actualización" value={solicitud.usuario_actualizacion} />
							</div>
						</div>
						{/* Comprobantes de pago */}
						<div>
							<h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Comprobantes de Pago</h3>
							{loadingComprobantes ? (
								<div className="text-blue-600">Cargando comprobantes...</div>
							) : errorComprobantes ? (
								<div className="text-red-600">{errorComprobantes}</div>
							) : comprobantes.length === 0 ? (
								<div className="text-gray-500 italic">No hay comprobantes de pago</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{comprobantes.map((comprobante) => (
										<div key={comprobante.id_comprobante} className="bg-blue-50 rounded-lg p-3 flex flex-col gap-2 border border-blue-100 shadow-sm">
											<div className="flex items-center gap-2">
												<FileText className="w-4 h-4 text-blue-500" />
												<span className="font-medium text-blue-900">{comprobante.nombre_archivo}</span>
											</div>
											<div className="flex gap-2 items-center">
												<a
													href={comprobante.ruta_archivo}
													target="_blank"
													rel="noopener noreferrer"
													className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
												>
													<ExternalLink className="w-4 h-4" />
													Ver completo
												</a>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
					{/* Right: Archivos adjuntos */}
					<div className="w-full lg:w-[420px] flex-shrink-0 p-6 flex flex-col gap-6">
						<div>
							<h3 className="text-lg font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-200 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" />Archivos Adjuntos</h3>
							{loading.archivos ? (
								<div className="text-blue-600">Cargando archivos adjuntos...</div>
							) : errors.archivos ? (
								<div className="text-red-600">{errors.archivos}</div>
							) : archivos.length === 0 ? (
								<div className="text-gray-500 italic">No hay archivos adjuntos</div>
							) : (
								<div className="grid grid-cols-1 gap-4">
														{archivos.map((archivo) => (
															<FilePreview key={archivo.id} archivo={archivo} />
														))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
