import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Search, BookOpen, X } from 'lucide-react';
import AdminHistorialAcademico from './AdminHistorialAcademico';

const AdminHistorial = () => {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlumno, setSelectedAlumno] = useState(null);
  const [showHistorialModal, setShowHistorialModal] = useState(false);

  useEffect(() => {
    const fetchAlumnos = async () => {
      try {
        setLoading(true);
        const data = await adminService.getAlumnos();
        setAlumnos(data);
      } catch (error) {
        console.error('Error al cargar alumnos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlumnos();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredAlumnos = alumnos.filter(alumno => 
    alumno.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumno.dni.includes(searchTerm) ||
    alumno.ciclo.toString().includes(searchTerm)
  );

  const handleVerHistorial = (alumno) => {
    setSelectedAlumno(alumno);
    setShowHistorialModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Historial Académico</h1>
      </div>

      {/* Buscador */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre, DNI o ciclo..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {/* Lista de alumnos */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredAlumnos.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No se encontraron alumnos con los criterios de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DNI
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ciclo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAlumnos.map((alumno) => (
                  <tr key={alumno.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {alumno.nombre_completo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {alumno.dni}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {alumno.ciclo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleVerHistorial(alumno)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                        title="Ver historial académico"
                      >
                        <BookOpen className="h-4 w-4 mr-1" />
                        Ver historial
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para ver historial académico */}
      {showHistorialModal && selectedAlumno && (
        <AdminHistorialAcademico 
          alumno={selectedAlumno} 
          onClose={() => setShowHistorialModal(false)} 
        />
      )}
    </div>
  );
};

export default AdminHistorial;