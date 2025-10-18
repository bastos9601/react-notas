import React, { useState, useEffect, useMemo } from 'react';
import { adminService } from '../../services/adminService';
import { BookOpen, User, GraduationCap, Calendar, Search, Eye, ChevronDown, ChevronRight } from 'lucide-react';

const AdminNotas = () => {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCiclo, setSelectedCiclo] = useState(null);
  const [expandedRows, setExpandedRows] = useState([]);
  
  // Manejador para expandir/colapsar filas
  const handleExpandRow = (alumnoId) => {
    setExpandedRows(prevExpandedRows => {
      if (prevExpandedRows.includes(alumnoId)) {
        return prevExpandedRows.filter(id => id !== alumnoId);
      } else {
        return [...prevExpandedRows, alumnoId];
      }
    });
  };
  const [notasPorAlumno, setNotasPorAlumno] = useState({});

  useEffect(() => {
    loadNotas();
  }, []);

  const loadNotas = async () => {
    try {
      setLoading(true);
      const data = await adminService.getNotas();
      setNotas(data);
    } catch (error) {
      console.error('Error al cargar notas:', error);
      alert('Error al cargar las notas');
    } finally {
      setLoading(false);
    }
  };

  const filteredNotas = notas.filter(nota => {
    const matchesSearch = nota.alumno_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nota.asignatura_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nota.docente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nota.alumno_dni.includes(searchTerm) ||
                         nota.alumno_ciclo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCiclo = selectedCiclo ? nota.alumno_ciclo === selectedCiclo : true;

    return matchesSearch && matchesCiclo;
  });
  
  // Usaremos getNotasAgrupadas() más adelante para mostrar los datos agrupados

  const getCalificacionColor = (calificacion) => {
    if (calificacion >= 18) return 'text-green-600 bg-green-50';
    if (calificacion >= 14) return 'text-blue-600 bg-blue-50';
    if (calificacion >= 11) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getCalificacionText = (calificacion) => {
    if (calificacion >= 18) return 'Excelente';
    if (calificacion >= 14) return 'Bueno';
    if (calificacion >= 11) return 'Regular';
    return 'Deficiente';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para calcular el promedio final simplificado: (Actividades + Parciales + Examen Final + Prácticas) ÷ 4
  const calcularPromedioFinalSimplificado = (notasAlumno) => {
    // Usar todas las notas (no filtrar por publicada ya que puede no existir ese campo)
    const todasLasNotas = notasAlumno;
    
    // Clasificar notas por tipo (usando toLowerCase para ser más flexible)
    const actividades = todasLasNotas.filter(nota => {
      const tipo = nota.tipo_nota?.toLowerCase() || '';
      return ['participacion', 'tarea', 'quiz', 'exposicion', 'laboratorio', 'trabajo_grupal', 'actividad'].includes(tipo);
    });
    
    const practicas = todasLasNotas.filter(nota => {
      const tipo = nota.tipo_nota?.toLowerCase() || '';
      return tipo === 'practica' || tipo === 'práctica';
    });
    
    const parciales = todasLasNotas.filter(nota => {
      const tipo = nota.tipo_nota?.toLowerCase() || '';
      return tipo === 'examen_parcial' || tipo === 'parcial';
    });
    
    const examenFinal = todasLasNotas.find(nota => {
      const tipo = nota.tipo_nota?.toLowerCase() || '';
      return tipo === 'examen_final' || tipo === 'final';
    });
    
    // Calcular promedios
    const promedioActividades = actividades.length > 0 
      ? actividades.reduce((sum, nota) => sum + nota.calificacion, 0) / actividades.length 
      : 0;
    
    const promedioPracticas = practicas.length > 0 
      ? practicas.reduce((sum, nota) => sum + nota.calificacion, 0) / practicas.length 
      : 0;
    
    const promedioParciales = parciales.length > 0 
      ? parciales.reduce((sum, nota) => sum + nota.calificacion, 0) / parciales.length 
      : 0;
    
    const notaExamenFinal = examenFinal ? examenFinal.calificacion : 0;
    
    // Promedio final simplificado: siempre dividir entre 4
    const sumaPromedios = promedioActividades + promedioPracticas + promedioParciales + notaExamenFinal;
    const promedioFinal = sumaPromedios / 4;
    
    // Debug: mostrar información de cálculo
    console.log('Debug cálculo promedio:', {
      totalNotas: todasLasNotas.length,
      actividades: actividades.length,
      practicas: practicas.length,
      parciales: parciales.length,
      examenFinal: !!examenFinal,
      promedioActividades,
      promedioPracticas,
      promedioParciales,
      notaExamenFinal,
      sumaPromedios,
      promedioFinal
    });
    
    return {
      promedioFinal: promedioFinal.toFixed(1),
      promedioActividades: promedioActividades.toFixed(1),
      promedioPracticas: promedioPracticas.toFixed(1),
      promedioParciales: promedioParciales.toFixed(1),
      notaExamenFinal: notaExamenFinal.toFixed(1),
      cantidadActividades: actividades.length,
      cantidadPracticas: practicas.length,
      cantidadParciales: parciales.length,
      tieneExamenFinal: !!examenFinal
    };
  };

  // Función para calcular el promedio general usando la lógica simplificada
  const calcularPromedioGeneral = () => {
    if (notas.length === 0) return '0.0';
    
    // Agrupar notas por alumno-asignatura
    const agrupadas = {};
    filteredNotas.forEach(nota => {
      const key = `${nota.alumno_id}-${nota.asignatura_id}`;
      if (!agrupadas[key]) {
        agrupadas[key] = [];
      }
      agrupadas[key].push(nota);
    });
    
    // Calcular promedio final para cada grupo usando la lógica simplificada
    const promediosFinales = Object.values(agrupadas).map(grupo => {
      const promedioFinalSimplificado = calcularPromedioFinalSimplificado(grupo);
      return parseFloat(promedioFinalSimplificado.promedioFinal);
    });
    
    // Calcular promedio general
    const promedioGeneral = promediosFinales.reduce((sum, promedio) => sum + promedio, 0) / promediosFinales.length;
    return promedioGeneral.toFixed(1);
  };

  // Obtener ciclos únicos con contadores de notas
  const ciclosConContadores = notas.reduce((acc, nota) => {
    const ciclo = nota.alumno_ciclo;
    if (ciclo) {
      if (!acc[ciclo]) {
        acc[ciclo] = 0;
      }
      acc[ciclo]++;
    }
    return acc;
  }, {});

  const ciclos = Object.keys(ciclosConContadores).sort();

  // La función getNotasAgrupadas ha sido eliminada ya que usamos useMemo directamente para calcular las notas agrupadas

  // Calculamos las notas agrupadas solo cuando cambian las notas filtradas
  const notasParaMostrar = useMemo(() => {
    if (!filteredNotas || filteredNotas.length === 0) {
      return [];
    }
    
    const agrupadasPorAlumno = {};
    const alumnosAgrupados = [];

    // Primero agrupar por alumno
    filteredNotas.forEach(nota => {
      const alumnoId = nota.alumno_id;
      if (!agrupadasPorAlumno[alumnoId]) {
        agrupadasPorAlumno[alumnoId] = {
          alumno_id: alumnoId,
          alumno_nombre: nota.alumno_nombre,
          alumno_dni: nota.alumno_dni,
          alumno_ciclo: nota.alumno_ciclo,
          asignaturas: {}
        };
      }
      
      // Solo incluir asignaturas del ciclo actual del alumno
      // Verificamos si la asignatura pertenece al ciclo del alumno
      const asignaturaCiclo = nota.asignatura_ciclo || nota.alumno_ciclo; // Si no existe, usamos el ciclo del alumno
      
      if (asignaturaCiclo === nota.alumno_ciclo) {
        // Luego agrupar por asignatura
        const asignaturaId = nota.asignatura_id;
        if (!agrupadasPorAlumno[alumnoId].asignaturas[asignaturaId]) {
          agrupadasPorAlumno[alumnoId].asignaturas[asignaturaId] = {
            asignatura_id: asignaturaId,
            asignatura_nombre: nota.asignatura_nombre,
            docente_nombre: nota.docente_nombre,
            notas: []
          };
        }
        
        // Agregar la nota a la asignatura
        agrupadasPorAlumno[alumnoId].asignaturas[asignaturaId].notas.push(nota);
      }
    });
    
    // Convertir a array y calcular promedios
    Object.values(agrupadasPorAlumno).forEach(alumno => {
      const asignaturasArray = [];
      let totalAsignaturas = 0;
      let sumaPromedios = 0;
      
      Object.values(alumno.asignaturas).forEach(asignatura => {
        const notas = asignatura.notas;
        const promedio = notas.reduce((sum, nota) => sum + nota.calificacion, 0) / notas.length;
        const maxNota = Math.max(...notas.map(nota => nota.calificacion));
        const minNota = Math.min(...notas.map(nota => nota.calificacion));
        
        asignaturasArray.push({
          ...asignatura,
          promedio: promedio.toFixed(2),
          max_nota: maxNota,
          min_nota: minNota,
          total_notas: notas.length
        });
        
        totalAsignaturas++;
        sumaPromedios += promedio;
      });
      
      alumnosAgrupados.push({
        ...alumno,
        asignaturas: asignaturasArray,
        total_asignaturas: totalAsignaturas,
        promedio_general: totalAsignaturas > 0 ? (sumaPromedios / totalAsignaturas).toFixed(2) : 0
      });
    });
    
    return alumnosAgrupados;
  }, [filteredNotas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando notas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Notas</h1>
          <p className="text-gray-600">Visualiza todas las notas del sistema</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <BookOpen className="h-4 w-4" />
          <span>{notas.length} notas registradas</span>
        </div>
      </div>

      {/* Mostrar tarjetas de ciclos si no hay ciclo seleccionado */}
      {!selectedCiclo ? (
        ciclos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ciclos.map((ciclo) => (
            <div key={ciclo} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Ciclo {ciclo}</h3>
                    <p className="text-sm text-gray-500">
                      {ciclosConContadores[ciclo]} {ciclosConContadores[ciclo] === 1 ? 'nota' : 'notas'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCiclo(ciclo)}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Mostrar
                </button>
              </div>
            </div>
          ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay notas registradas</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se han registrado notas en el sistema aún.
            </p>
          </div>
        )
      ) : (
        <>
          {/* Filtro activo */}
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">
                Mostrando notas del Ciclo {selectedCiclo}
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedCiclo(null);
                setSearchTerm('');
              }}
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Ver todos los ciclos
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por alumno, asignatura, docente, DNI..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </>
      )}

      {/* Stats Cards y Tabla - solo mostrar cuando hay ciclo seleccionado */}
      {selectedCiclo && (
        <>
          {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Notas</p>
              <p className="text-2xl font-bold text-gray-900">{notas.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Alumnos con Notas</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(notas.map(n => n.alumno_id)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Asignaturas</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(notas.map(n => n.asignatura_id)).size}
              </p>
            </div>
          </div>
        </div>

        {/* <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Promedio General</p>
              <p className="text-2xl font-bold text-gray-900">
                {calcularPromedioGeneral()}
              </p>
            </div>
          </div>
        </div> */}

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Ciclos</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(notas.map(n => n.alumno_ciclo)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notas Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alumno
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
                  Calificación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notasParaMostrar.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'No se encontraron notas que coincidan con la búsqueda' : 'No hay notas registradas'}
                  </td>
                </tr>
              ) : (
                notasParaMostrar.map((item, index) => {
                    const alumnoId = item.alumno_id || item.id;
                    const alumnoNombre = item.alumno_nombre;
                    
                    return (
                      <React.Fragment key={item.asignaturas ? `alumno-${item.alumno_id}` : item.id}>
                      {/* Si es un alumno con asignaturas */}
                      {item.asignaturas ? (
                        <>
                        <tr className={`hover:bg-gray-50 ${expandedRows.includes(item.alumno_id) ? 'bg-blue-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <button 
                                type="button"
                                onClick={() => handleExpandRow(item.alumno_id)}
                                className="mr-2 text-gray-500 hover:text-blue-600 focus:outline-none"
                              >
                                {expandedRows.includes(item.alumno_id) ? 
                                  <ChevronDown className="h-5 w-5" /> : 
                                  <ChevronRight className="h-5 w-5" />
                                }
                              </button>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.alumno_nombre}
                                </div>
                                <div className="text-sm text-gray-500">
                                  DNI: {item.alumno_dni}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {item.alumno_ciclo}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.totalAsignaturas} asignaturas
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              Múltiples docentes
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCalificacionColor(parseFloat(item.promedioGeneral))}`}>
                                  Promedio: {item.promedioGeneral}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatDate(item.fechaMasReciente)}
                            </div>
                          </td>
                        </tr>
                        
                        {/* Fila expandible con los promedios detallados */}
                        {expandedRows.includes(item.alumno_id) && (
                          <tr className="bg-gray-50">
                            <td colSpan="6" className="px-6 py-4">
                              <div className="pl-7 border-l-2 border-blue-400">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Asignaturas de {item.alumno_nombre}</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {item.asignaturas && item.asignaturas.map((asignatura) => (
                                      <div key={asignatura.id} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-center mb-1">
                                          <h5 className="font-medium text-gray-900">{asignatura.nombre}</h5>
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCalificacionColor(parseFloat(asignatura.promedio))}`}>
                                            Promedio: {asignatura.promedio}
                                          </span>
                                        </div>
                                        <div className="text-sm text-gray-600 mb-1">Docente: {asignatura.docente}</div>
                                        <div className="text-xs text-gray-500">
                                          {asignatura.totalNotas} notas • Max: {asignatura.notaMaxima} • Min: {asignatura.notaMinima}
                                        </div>
                                      </div>
                                      ))}
                                    </div>
                                  </div>
                                
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Detalle de notas:</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {item.notas && item.notas.map((nota, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-md border border-gray-200">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-gray-700">{nota.tipo_nota || 'Nota'}</span>
                                        <span className={`text-sm font-medium ${getCalificacionColor(nota.calificacion)}`}>
                                          {nota.calificacion}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-500">{formatDate(nota.fecha_registro)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        </>
                      ) : (
                        /* Nota individual */
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.alumno_nombre}
                              </div>
                              <div className="text-sm text-gray-500">
                                DNI: {item.alumno_dni}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {item.alumno_ciclo}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.asignatura_nombre}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.docente_nombre}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCalificacionColor(item.calificacion)}`}>
                                {item.calificacion} {getCalificacionText(item.calificacion)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatDate(item.fecha_registro)}
                            </div>
                          </td>
                        </tr>
                      )}
                      
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary by Student */}
      {notas.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen por Alumno</h3>
          <div className="space-y-3">
            {Object.entries(
              filteredNotas.reduce((acc, nota) => {
                if (!acc[nota.alumno_id]) {
                  acc[nota.alumno_id] = {
                    nombre: nota.alumno_nombre,
                    dni: nota.alumno_dni,
                    ciclo: nota.alumno_ciclo,
                    notas: []
                  };
                }
                acc[nota.alumno_id].notas.push(nota.calificacion);
                return acc;
              }, {})
            ).map(([alumnoId, data]) => {
              const promedio = data.notas.reduce((sum, nota) => sum + nota, 0) / data.notas.length;
              return (
                <div key={alumnoId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{data.nombre}</div>
                    <div className="text-sm text-gray-500">DNI: {data.dni}</div>
                    <div className="text-sm text-gray-500">
                      Ciclo: <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                        {data.ciclo}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">{data.notas.length} notas</div>
                    <div className={`font-semibold ${getCalificacionColor(promedio)}`}>
                      Promedio: {promedio.toFixed(1)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default AdminNotas;
