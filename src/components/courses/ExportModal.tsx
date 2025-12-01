'use client';

import { useState } from 'react';
import { X, Download, Loader2, CheckSquare, Square, ChevronDown, ChevronRight, User, BarChart3, Calendar } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  courseName: string;
}

export interface ExportOptions {
  dni: boolean;
  email: boolean;
  phone: boolean;
  grades: boolean;
  attendanceStats: boolean;
  attendanceDetails: boolean;
}

export function ExportModal({ isOpen, onClose, onExport, courseName }: ExportModalProps) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    dni: true,
    email: true,
    phone: true,
    grades: true,
    attendanceStats: true,
    attendanceDetails: true,
  });

  const [expandedSections, setExpandedSections] = useState({
    personal: false,
    metrics: false,
    details: false,
  });

  if (!isOpen) return null;

  const handleToggle = (key: keyof ExportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSelectAll = (section: keyof typeof expandedSections, checked: boolean) => {
    setOptions(prev => {
      const newOptions = { ...prev };
      if (section === 'personal') {
        newOptions.dni = checked;
        newOptions.email = checked;
        newOptions.phone = checked;
      } else if (section === 'metrics') {
        newOptions.grades = checked;
        newOptions.attendanceStats = checked;
      } else if (section === 'details') {
        newOptions.attendanceDetails = checked;
      }
      return newOptions;
    });
  };

  const isSectionSelected = (section: keyof typeof expandedSections) => {
    if (section === 'personal') return options.dni && options.email && options.phone;
    if (section === 'metrics') return options.grades && options.attendanceStats;
    if (section === 'details') return options.attendanceDetails;
    return false;
  };

  const isSectionIndeterminate = (section: keyof typeof expandedSections) => {
    if (section === 'personal') {
      const count = [options.dni, options.email, options.phone].filter(Boolean).length;
      return count > 0 && count < 3;
    }
    if (section === 'metrics') {
      const count = [options.grades, options.attendanceStats].filter(Boolean).length;
      return count > 0 && count < 2;
    }
    return false; // Details has only one option
  };

  const handleExportClick = async () => {
    setLoading(true);
    try {
      await onExport(options);
      onClose();
    } catch (error) {
      console.error('Error exporting:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 transition-colors flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Exportar Datos</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Configura el reporte para <span className="font-medium text-gray-900 dark:text-white">{courseName}</span>.
            <br />
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
              * Apellido y Nombre se incluyen siempre automáticamente.
            </span>
          </p>

          <div className="space-y-4">
            {/* Sección Datos Personales */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleSection('personal')}>
                  <div 
                    className="relative flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAll('personal', !isSectionSelected('personal'));
                    }}
                  >
                    <input
                      type="checkbox"
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 dark:border-gray-600 checked:bg-indigo-600 checked:border-transparent transition-all"
                      checked={isSectionSelected('personal')}
                      readOnly
                    />
                    <CheckSquare className={`absolute pointer-events-none w-4 h-4 text-white ${isSectionSelected('personal') ? 'opacity-100' : 'opacity-0'}`} />
                    <Square className={`absolute pointer-events-none w-4 h-4 text-transparent ${!isSectionSelected('personal') ? 'opacity-100' : 'opacity-0'}`} />
                    {isSectionIndeterminate('personal') && !isSectionSelected('personal') && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-2 h-2 bg-indigo-600 rounded-sm"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-medium text-gray-900 dark:text-white text-sm">Datos del Alumno</span>
                  </div>
                </div>
                <button onClick={() => toggleSection('personal')} className="p-1">
                  {expandedSections.personal ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                </button>
              </div>
              
              {expandedSections.personal && (
                <div className="p-4 space-y-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200">
                  <Checkbox label="Legajo / DNI" checked={options.dni} onChange={() => handleToggle('dni')} />
                  <Checkbox label="Email" checked={options.email} onChange={() => handleToggle('email')} />
                  <Checkbox label="Teléfono" checked={options.phone} onChange={() => handleToggle('phone')} />
                </div>
              )}
            </div>

            {/* Sección Métricas */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleSection('metrics')}>
                  <div 
                    className="relative flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAll('metrics', !isSectionSelected('metrics'));
                    }}
                  >
                    <input
                      type="checkbox"
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 dark:border-gray-600 checked:bg-indigo-600 checked:border-transparent transition-all"
                      checked={isSectionSelected('metrics')}
                      readOnly
                    />
                    <CheckSquare className={`absolute pointer-events-none w-4 h-4 text-white ${isSectionSelected('metrics') ? 'opacity-100' : 'opacity-0'}`} />
                    <Square className={`absolute pointer-events-none w-4 h-4 text-transparent ${!isSectionSelected('metrics') ? 'opacity-100' : 'opacity-0'}`} />
                    {isSectionIndeterminate('metrics') && !isSectionSelected('metrics') && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-2 h-2 bg-indigo-600 rounded-sm"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-medium text-gray-900 dark:text-white text-sm">Métricas y Promedios</span>
                  </div>
                </div>
                <button onClick={() => toggleSection('metrics')} className="p-1">
                  {expandedSections.metrics ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                </button>
              </div>
              
              {expandedSections.metrics && (
                <div className="p-4 space-y-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200">
                  <Checkbox label="Promedio de Calificaciones" checked={options.grades} onChange={() => handleToggle('grades')} />
                  <Checkbox label="Estadísticas de Asistencia (Presente/Ausente)" checked={options.attendanceStats} onChange={() => handleToggle('attendanceStats')} />
                </div>
              )}
            </div>

            {/* Sección Detalles */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleSection('details')}>
                  <div 
                    className="relative flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAll('details', !isSectionSelected('details'));
                    }}
                  >
                    <input
                      type="checkbox"
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 dark:border-gray-600 checked:bg-indigo-600 checked:border-transparent transition-all"
                      checked={isSectionSelected('details')}
                      readOnly
                    />
                    <CheckSquare className={`absolute pointer-events-none w-4 h-4 text-white ${isSectionSelected('details') ? 'opacity-100' : 'opacity-0'}`} />
                    <Square className={`absolute pointer-events-none w-4 h-4 text-transparent ${!isSectionSelected('details') ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-medium text-gray-900 dark:text-white text-sm">Detalles</span>
                  </div>
                </div>
                <button onClick={() => toggleSection('details')} className="p-1">
                  {expandedSections.details ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                </button>
              </div>
              
              {expandedSections.details && (
                <div className="p-4 space-y-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200">
                  <Checkbox 
                    label="Detalle de Asistencias por Fecha" 
                    description="Incluye una columna por cada día de clase con el estado (P/A/T)"
                    checked={options.attendanceDetails} 
                    onChange={() => handleToggle('attendanceDetails')} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleExportClick}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar CSV
          </button>
        </div>
      </div>
    </div>
  );
}

function Checkbox({ label, description, checked, onChange }: { label: string, description?: string, checked: boolean, onChange: () => void }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative flex items-center mt-0.5">
        <input
          type="checkbox"
          className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 dark:border-gray-600 checked:bg-indigo-600 checked:border-transparent transition-all"
          checked={checked}
          onChange={onChange}
        />
        <CheckSquare className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 w-4 h-4 text-white" />
        <Square className="absolute pointer-events-none opacity-100 peer-checked:opacity-0 w-4 h-4 text-transparent" />
      </div>
      <div className="flex-1">
        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{label}</span>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}
