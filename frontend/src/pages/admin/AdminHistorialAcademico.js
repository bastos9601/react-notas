import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { adminService } from '../../services/adminService';

const AdminHistorialAcademico = ({ alumno, onClose }) => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        setLoading(true);
        const data = await adminService.getHistorialAcademicoAlumno(alumno.id);
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
      } catch (error) {
        console.error('Error al cargar historial académico:', error);
      } finally {
        setLoading(false);
      }
    };

    if (alumno) {
      fetchHistorial();
    }
  }, [alumno]);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-3/4 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-xl font-medium text-gray-900">
            Historial Académico - {alumno?.nombre_completo}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        ) : historial.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No hay historial académico disponible para este alumno.</p>
          </div>
        ) : (
          <div className="mt-4">
            {historial.map((ciclo, index) => (
              <div key={index} className="mb-6 border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 font-medium">
                  {ciclo.ciclo}
                </div>
                <div className="p-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Asignatura
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nota
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ciclo.asignaturas.map((asignatura) => (
                        <tr key={asignatura.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {asignatura.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {asignatura.promedio !== undefined ? asignatura.promedio.toFixed(2) : 
                             asignatura.nota !== null ? asignatura.nota : 'No registrada'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {asignatura.promedio !== undefined ? (
                              asignatura.promedio >= 11 ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Aprobado
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Desaprobado
                                </span>
                              )
                            ) : asignatura.nota !== null ? (
                              asignatura.nota >= 11 ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Aprobado
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Desaprobado
                                </span>
                              )
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Pendiente
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHistorialAcademico;