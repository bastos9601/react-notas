import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Calendar, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { adminService } from '../../services/adminService';

const AdminMatriculas = () => {
  const [matriculas, setMatriculas] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCiclo, setSelectedCiclo] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [formData, setFormData] = useState({
    alumno_id: '',
    asignatura_id: ''
  });
  const [dniSearchTerm, setDniSearchTerm] = useState('');
  const [filteredAlumnos, setFilteredAlumnos] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (dniSearchTerm) {
      const filtered = alumnos.filter(alumno => 
        alumno.dni.toLowerCase().includes(dniSearchTerm.toLowerCase()) ||
        alumno.nombre_completo.toLowerCase().includes(dniSearchTerm.toLowerCase())
      );
      setFilteredAlumnos(filtered);
    } else {
      setFilteredAlumnos(alumnos);
    }
  }, [dniSearchTerm, alumnos]);

  const loadData = async () => {
    try {
      const [matriculasData, alumnosData, asignaturasData] = await Promise.all([
        adminService.getMatriculas(),
        adminService.getAlumnos(),
        adminService.getAsignaturas()
      ]);
      setMatriculas(matriculasData);
      setAlumnos(alumnosData);
      setAsignaturas(asignaturasData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAsignaturasPorCiclo = async (ciclo) => {
    try {
      const asignaturasData = await adminService.getAsignaturas(ciclo);
      setAsignaturas(asignaturasData);
    } catch (error) {
      console.error('Error al cargar asignaturas por ciclo:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const alumnoSeleccionado = alumnos.find(a => a.id == formData.alumno_id);
    
    try {
      // Enviamos solo el ID del alumno, el backend se encargará de matricularlo en todas las asignaturas de su ciclo
      const response = await adminService.createMatricula({
        alumno_id: parseInt(formData.alumno_id),
        asignatura_id: 0 // Valor ficticio, el backend lo ignorará
      });
      
      // Preparar mensaje según si se envió el email o no
      let mensaje = '';
      
      if (response.email_sent) {
        // Email enviado exitosamente
        mensaje = `
✅ ¡Matrícula exitosa!

Alumno: ${response.alumno}
Ciclo: ${response.ciclo}
Asignaturas matriculadas: ${response.matriculas.length}

Se ha enviado una contraseña temporal al correo del alumno.
        `;
      } else if (response.temp_password) {
        // Email falló, mostrar contraseña temporal
        mensaje = `
⚠️ ¡Matrícula exitosa!

Alumno: ${response.alumno}
Ciclo: ${response.ciclo}
Asignaturas matriculadas: ${response.matriculas.length}

Contraseña temporal: ${response.temp_password}

${response.instructions || 'No se pudo enviar el email con la contraseña.'}
        `;
      } else {
        // No hay información de email (caso improbable)
        mensaje = `¡Matrícula exitosa! El alumno ha sido matriculado automáticamente en ${response.matriculas.length} asignaturas de ${alumnoSeleccionado?.ciclo}.`;
      }
      
      alert(mensaje);
      
      loadData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error al crear matrícula:', error);
      alert('Error al crear la matrícula: ' + (error.response?.data?.detail || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      alumno_id: '',
      asignatura_id: ''
    });
    setDniSearchTerm('');
  };

  const handleDeleteMatricula = async (alumnoId, asignaturaId) => {
    try {
      await adminService.deleteMatricula(alumnoId, asignaturaId);
      loadData(); // Recargar los datos después de eliminar
    } catch (error) {
      console.error('Error al eliminar matrícula:', error);
      alert('Error al eliminar la matrícula. Inténtalo de nuevo.');
    }
  };

  // Obtener ciclos únicos con contadores de alumnos únicos matriculados
  const ciclosConContadores = matriculas.reduce((acc, matricula) => {
    const ciclo = matricula.alumno?.ciclo;
    const alumnoId = matricula.alumno?.id;
    
    if (ciclo && alumnoId) {
      if (!acc[ciclo]) {
        acc[ciclo] = { count: 0, alumnos: new Set() };
      }
      
      // Solo incrementar si es un alumno nuevo
      if (!acc[ciclo].alumnos.has(alumnoId)) {
        acc[ciclo].alumnos.add(alumnoId);
        acc[ciclo].count++;
      }
    }
    return acc;
  }, {});

  const ciclos = Object.keys(ciclosConContadores).sort();

  const filteredMatriculas = matriculas.filter(matricula => {
    const matchesSearch = matricula.alumno?.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         matricula.asignatura?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         matricula.alumno?.dni.includes(searchTerm) ||
                         matricula.alumno?.ciclo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCiclo = selectedCiclo ? matricula.alumno?.ciclo === selectedCiclo : true;
    
    return matchesSearch && matchesCiclo;
  });

  // Función para agrupar matrículas por alumno cuando tengan más de 1 asignatura
  const getMatriculasAgrupadas = () => {
    const agrupadas = {};
    const matriculasParaMostrar = [];

    console.log('Matrículas filtradas:', filteredMatriculas);

    filteredMatriculas.forEach(matricula => {
      const key = matricula.alumno?.id;
      
      if (!agrupadas[key]) {
        agrupadas[key] = {
          alumno_id: matricula.alumno?.id,
          alumno_nombre: matricula.alumno?.nombre_completo,
          alumno_dni: matricula.alumno?.dni,
          alumno_ciclo: matricula.alumno?.ciclo,
          matriculas: []
        };
      }
      
      agrupadas[key].matriculas.push(matricula);
    });

    console.log('Grupos formados:', agrupadas);

    // Separar en agrupadas (más de 1 asignatura) e individuales
    Object.values(agrupadas).forEach(grupo => {
      console.log(`Alumno ${grupo.alumno_nombre} tiene ${grupo.matriculas.length} asignaturas`);
      if (grupo.matriculas.length > 1) {
        // Agrupar - mostrar todas las asignaturas en una fila expandible
        grupo.esAgrupado = true;
        grupo.totalAsignaturas = grupo.matriculas.length;
        matriculasParaMostrar.push(grupo);
        console.log(`Agrupando a ${grupo.alumno_nombre} con ${grupo.totalAsignaturas} asignaturas`);
      } else {
        // No agrupar - mostrar cada matrícula individualmente
        grupo.matriculas.forEach(matricula => {
          matriculasParaMostrar.push(matricula);
        });
        console.log(`No agrupando a ${grupo.alumno_nombre} (${grupo.matriculas.length} asignaturas)`);
      }
    });

    console.log('Matrículas para mostrar:', matriculasParaMostrar);
    return matriculasParaMostrar;
  };

  const matriculasParaMostrar = getMatriculasAgrupadas();

  const toggleGroupExpansion = (alumnoId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [alumnoId]: !prev[alumnoId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Matrículas</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Matrícula
        </button>
      </div>

      {/* Tarjetas de Ciclos */}
      {ciclos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ciclos.map((ciclo) => (
            <div
              key={ciclo}
              className={`bg-white p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                selectedCiclo === ciclo 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedCiclo(selectedCiclo === ciclo ? null : ciclo)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">Ciclo {ciclo}</h3>
                    <p className="text-sm text-gray-500">
                      {ciclosConContadores[ciclo].count} {ciclosConContadores[ciclo].count === 1 ? 'alumno matriculado' : 'alumnos matriculados'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center text-blue-600">
                  <Eye className="h-4 w-4" />
                  <span className="ml-1 text-sm font-medium">Mostrar</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Solo mostrar tabla y búsqueda cuando hay un ciclo seleccionado */}
      {selectedCiclo && (
        <>
          {/* Filtros activos */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Filtro activo:</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Ciclo {selectedCiclo}
              <button
                onClick={() => {
                  setSelectedCiclo(null);
                  setSearchTerm(''); // Limpiar también la búsqueda
                }}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          </div>

          {/* Búsqueda */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por alumno, asignatura, DNI o ciclo..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tabla de matrículas */}
          <div className="card">
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
                      Asignatura
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Docente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {matriculasParaMostrar.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        {selectedCiclo 
                          ? `No hay matrículas en el Ciclo ${selectedCiclo}${searchTerm ? ' que coincidan con la búsqueda' : ''}`
                          : searchTerm 
                            ? 'No se encontraron matrículas que coincidan con la búsqueda'
                            : 'No hay matrículas registradas'
                        }
                      </td>
                    </tr>
                  ) : (
                    matriculasParaMostrar.map((item, index) => {
                      // Si es un grupo (tiene la propiedad 'esAgrupado')
                      if (item.esAgrupado) {
                        const isExpanded = expandedGroups[item.alumno_id];
                        return (
                          <React.Fragment key={`grupo-${item.alumno_id}`}>
                            {/* Fila principal del grupo */}
                            <tr className="hover:bg-gray-50 bg-blue-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <div className="flex items-center">
                                  <button
                                    onClick={() => toggleGroupExpansion(item.alumno_id)}
                                    className="mr-2 text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                  </button>
                                  {item.alumno_nombre}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.alumno_dni}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  {item.alumno_ciclo}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {item.totalAsignaturas} asignaturas
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className="text-gray-400">Varias asignaturas</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => toggleGroupExpansion(item.alumno_id)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                  title={isExpanded ? "Contraer" : "Expandir"}
                                >
                                  {isExpanded ? "Contraer" : "Ver asignaturas"}
                                </button>
                              </td>
                            </tr>
                            
                            {/* Filas expandidas con las asignaturas */}
                            {isExpanded && item.matriculas.map((matricula, matIndex) => (
                              <tr key={`${matricula.alumno_id}-${matricula.asignatura_id}`} className="hover:bg-gray-50 bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 pl-12">
                                  └─ {matricula.asignatura?.nombre}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {matricula.asignatura?.docente?.nombre_completo}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    {matricula.alumno?.ciclo}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {matricula.asignatura?.nombre}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {matricula.asignatura?.docente?.nombre_completo}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`¿Estás seguro de eliminar la matrícula de ${matricula.alumno?.nombre_completo} en ${matricula.asignatura?.nombre}?`)) {
                                        handleDeleteMatricula(matricula.alumno_id, matricula.asignatura_id);
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-900 transition-colors"
                                    title="Eliminar matrícula"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      } else {
                        // Matrícula individual
                        return (
                          <tr key={`${item.alumno_id}-${item.asignatura_id}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.alumno?.nombre_completo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.alumno?.dni}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {item.alumno?.ciclo}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.asignatura?.nombre}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.asignatura?.docente?.nombre_completo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => {
                                  if (window.confirm(`¿Estás seguro de eliminar la matrícula de ${item.alumno?.nombre_completo} en ${item.asignatura?.nombre}?`)) {
                                    handleDeleteMatricula(item.alumno_id, item.asignatura_id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Eliminar matrícula"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Mensaje cuando no hay ciclo seleccionado */}
      {!selectedCiclo && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            Selecciona un ciclo para ver las matrículas
          </div>
          <div className="text-gray-400 text-sm mt-2">
            Haz clic en una de las tarjetas de ciclo arriba para comenzar
          </div>
        </div>
      )}

      {/* Modal para crear matrícula */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Nueva Matrícula
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Buscador por DNI */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar Alumno por DNI o Nombre
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Escribir DNI o nombre del alumno..."
                      className="input-field pl-10"
                      value={dniSearchTerm}
                      onChange={(e) => setDniSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Alumno
                  </label>
                  <select
                    required
                    className="input-field"
                    value={formData.alumno_id}
                    onChange={(e) => {
                      const alumnoId = e.target.value;
                      const alumnoSeleccionado = alumnos.find(a => a.id == alumnoId);
                      setFormData({...formData, alumno_id: alumnoId, asignatura_id: ''});
                      
                      // Cargar asignaturas del ciclo del alumno seleccionado
                      if (alumnoSeleccionado) {
                        loadAsignaturasPorCiclo(alumnoSeleccionado.ciclo);
                      } else {
                        // Si no hay alumno seleccionado, cargar todas las asignaturas
                        loadData();
                      }
                    }}
                  >
                    <option value="">Seleccionar alumno</option>
                    {filteredAlumnos.map((alumno) => (
                      <option key={alumno.id} value={alumno.id}>
                        {alumno.nombre_completo} - {alumno.dni} ({alumno.ciclo})
                      </option>
                    ))}
                  </select>
                  {dniSearchTerm && filteredAlumnos.length === 0 && (
                    <div className="text-sm text-red-600 mt-1">
                      No se encontraron alumnos con ese DNI o nombre
                    </div>
                  )}
                </div>
                
                {/* Mostrar ciclo del alumno seleccionado */}
                {formData.alumno_id && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm text-blue-800">
                      <strong>Ciclo del alumno:</strong> {alumnos.find(a => a.id == formData.alumno_id)?.ciclo}
                    </div>
                    <div className="text-xs text-green-600 mt-1 font-semibold">
                      El alumno será matriculado automáticamente en todas las asignaturas de su ciclo
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Matricular
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMatriculas;
