import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, User, Search, BookOpen } from 'lucide-react';
import { docenteService } from '../../services/docenteService';

const DocenteAlumnos = () => {
  const { asignaturaId } = useParams();
  const navigate = useNavigate();
  const [alumnos, setAlumnos] = useState([]);
  const [asignatura, setAsignatura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [asignaturaId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [alumnosData, asignaturasData] = await Promise.all([
        docenteService.getAlumnosPorAsignatura(asignaturaId),
        docenteService.getMisAsignaturas()
      ]);
      
      setAlumnos(alumnosData);
      
      // Encontrar la asignatura actual
      const asignaturaActual = asignaturasData.find(a => a.id === parseInt(asignaturaId));
      setAsignatura(asignaturaActual);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      alert('Error al cargar los datos de alumnos');
    } finally {
      setLoading(false);
    }
  };

  const filteredAlumnos = alumnos.filter(alumno =>
    alumno.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumno.dni.includes(searchTerm) ||
    alumno.ciclo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando alumnos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/docente/asignaturas')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Volver a Asignaturas</span>
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BookOpen className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Alumnos Matriculados
            </h1>
            <p className="text-gray-600">
              {asignatura ? asignatura.nombre : 'Cargando...'}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Buscar por nombre, DNI o ciclo..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Alumnos</p>
              <p className="text-2xl font-bold text-gray-900">{alumnos.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Alumnos Encontrados</p>
              <p className="text-2xl font-bold text-gray-900">{filteredAlumnos.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Asignatura</p>
              <p className="text-lg font-bold text-gray-900">
                {asignatura ? asignatura.nombre : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alumnos Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alumno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DNI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ciclo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAlumnos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'No se encontraron alumnos que coincidan con la búsqueda' : 'No hay alumnos matriculados en esta asignatura'}
                  </td>
                </tr>
              ) : (
                filteredAlumnos.map((alumno) => (
                  <tr key={alumno.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {alumno.nombre_completo}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {alumno.dni}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {alumno.ciclo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {alumno.usuario?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/docente/notas/${asignaturaId}/${alumno.id}`)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Gestionar notas del alumno"
                      >
                        Gestionar Notas
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      {alumnos.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
              <p className="text-gray-600">Gestiona las notas de todos los alumnos</p>
            </div>
            <button
              onClick={() => navigate(`/docente/notas/${asignaturaId}`)}
              className="btn-primary"
            >
              Gestionar Todas las Notas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocenteAlumnos;
