import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Mail, Hash, Calendar, Search, Eye, EyeOff } from 'lucide-react';
import { docenteService } from '../../services/docenteService';

const DocenteAlumnosCiclo = () => {
  const [ciclos, setCiclos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCiclo, setSelectedCiclo] = useState('');
  const [expandedCiclos, setExpandedCiclos] = useState({});

  useEffect(() => {
    loadAlumnosPorCiclo();
  }, []);

  const loadAlumnosPorCiclo = async () => {
    try {
      const data = await docenteService.getAlumnosPorCiclo();
      setCiclos(data.ciclos || []);
    } catch (error) {
      console.error('Error al cargar alumnos por ciclo:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCiclo = (ciclo) => {
    setExpandedCiclos(prev => ({
      ...prev,
      [ciclo]: !prev[ciclo]
    }));
  };

  const getFilteredCiclos = () => {
    if (!searchTerm) return ciclos;
    
    return ciclos.map(ciclo => ({
      ...ciclo,
      alumnos: ciclo.alumnos.filter(alumno =>
        alumno.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alumno.dni.includes(searchTerm) ||
        alumno.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(ciclo => ciclo.alumnos.length > 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const filteredCiclos = getFilteredCiclos();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Alumnos por Ciclo</h1>
          <p className="text-gray-600">Organiza y gestiona tus alumnos por ciclo académico</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, DNI o email..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              className="input-field"
              value={selectedCiclo}
              onChange={(e) => setSelectedCiclo(e.target.value)}
            >
              <option value="">Todos los ciclos</option>
              {ciclos.map(ciclo => (
                <option key={ciclo.ciclo} value={ciclo.ciclo}>
                  {ciclo.ciclo}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Ciclos</p>
              <p className="text-2xl font-bold text-gray-900">{ciclos.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Alumnos</p>
              <p className="text-2xl font-bold text-gray-900">
                {ciclos.reduce((total, ciclo) => total + ciclo.total_alumnos, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Promedio por Ciclo</p>
              <p className="text-2xl font-bold text-gray-900">
                {ciclos.length > 0 ? Math.round(ciclos.reduce((total, ciclo) => total + ciclo.total_alumnos, 0) / ciclos.length) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Ciclos */}
      {filteredCiclos.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay alumnos</h3>
          <p className="text-gray-600">
            {searchTerm ? 'No se encontraron alumnos con los criterios de búsqueda.' : 'No tienes alumnos asignados en ningún ciclo.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCiclos
            .filter(ciclo => !selectedCiclo || ciclo.ciclo === selectedCiclo)
            .map(ciclo => (
            <div key={ciclo.ciclo} className="bg-white rounded-lg shadow">
              {/* Header del Ciclo */}
              <div 
                className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleCiclo(ciclo.ciclo)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Ciclo {ciclo.ciclo}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {ciclo.total_alumnos} alumno{ciclo.total_alumnos !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">
                      {expandedCiclos[ciclo.ciclo] ? 'Ocultar' : 'Mostrar'}
                    </span>
                    {expandedCiclos[ciclo.ciclo] ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Lista de Alumnos */}
              {expandedCiclos[ciclo.ciclo] && (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ciclo.alumnos.map(alumno => (
                      <div key={alumno.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{alumno.nombre_completo}</h4>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Hash className="h-4 w-4 mr-1" />
                              {alumno.dni}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 mt-1">
                              <Mail className="h-4 w-4 mr-1" />
                              {alumno.email}
                            </div>
                          </div>
                        </div>
                        
                        {/* Asignaturas */}
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-700 mb-2">Asignaturas:</p>
                          <div className="flex flex-wrap gap-1">
                            {alumno.asignaturas.map(asignatura => (
                              <span 
                                key={asignatura.id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {asignatura.nombre}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocenteAlumnosCiclo;
