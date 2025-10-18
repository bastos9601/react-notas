import React, { useState, useEffect } from 'react';
import { alumnoService } from '../../services/alumnoService';
import { BookOpen, FileText, ChevronDown, ChevronRight, Clock } from 'lucide-react';

const HistorialAcademico = () => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [expandedCiclos, setExpandedCiclos] = useState({});

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        setLoading(true);
        const data = await alumnoService.getHistorialAcademico();
        
        // Filtrar para eliminar las entradas con "Ciclo Anterior"
        const filteredData = data.filter(item => !item.ciclo.includes("Ciclo Anterior"));
        
        // Transformar los nombres de ciclo a "Ciclo: I", "Ciclo: II", etc.
        const formattedData = filteredData.map(item => {
          // Si el ciclo es un número romano (I, II, III, etc.), mantenerlo como está
          if (/^[IVX]+$/.test(item.ciclo)) {
            return { ...item, ciclo: `Ciclo: ${item.ciclo}` };
          }
          return item;
        });
        
        setHistorial(formattedData);
        setError(null);
      } catch (err) {
        console.error("Error al cargar el historial académico:", err);
        setError("No se pudo cargar el historial académico");
      } finally {
        setLoading(false);
      }
    };

    cargarHistorial();
  }, []);
  const toggleMostrarHistorial = () => {
    setMostrarHistorial(!mostrarHistorial);
  };

  const toggleExpandCiclo = (cicloId) => {
    setExpandedCiclos({
      ...expandedCiclos,
      [cicloId]: !expandedCiclos[cicloId]
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg shadow-sm border border-red-200 text-red-700">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Historial académico completo */}
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Historial Académico</h2>
          <button
            onClick={toggleMostrarHistorial}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Clock className="h-4 w-4 mr-2" />
            {mostrarHistorial ? "Ocultar Historial" : "Ver Historial"}
          </button>
        </div>

        {historial.length === 0 ? (
          <p className="text-gray-600">No tienes historial académico de ciclos anteriores.</p>
        ) : mostrarHistorial && (
          <div className="mt-4 space-y-6">
            {/* Filtrar ciclos duplicados basados en el nombre del ciclo */}
            {historial
              .filter((ciclo, index, self) => 
                index === self.findIndex((c) => c.ciclo === ciclo.ciclo)
              )
              .map((ciclo) => (
              <div key={ciclo.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="bg-gray-50 p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleExpandCiclo(ciclo.id)}
                >
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">{ciclo.ciclo}</h3>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <span className="mr-2 text-sm">
                      {new Date(ciclo.fecha_registro).toLocaleDateString()}
                    </span>
                    {expandedCiclos[ciclo.id] ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>
                </div>

                {expandedCiclos[ciclo.id] && (
                  <div className="p-4">
                    <h4 className="text-md font-medium text-gray-700 mb-3">Asignaturas</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Asignatura
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Promedio
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Notas
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {ciclo.asignaturas.map((asignatura) => (
                            <tr key={asignatura.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {asignatura.nombre}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  asignatura.promedio >= 11 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {asignatura.promedio.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex flex-wrap gap-2">
                                  {asignatura.notas.map((nota) => (
                                    <span 
                                      key={nota.id} 
                                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        nota.calificacion >= 11 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                      title={`${nota.tipo_nota} - ${new Date(nota.fecha_registro).toLocaleDateString()}`}
                                    >
                                      {nota.tipo_nota}: {nota.calificacion}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialAcademico;