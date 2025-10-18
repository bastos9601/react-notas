import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, TrendingUp, Award, BookOpen, Search, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { alumnoService } from '../../services/alumnoService';

const AlumnoNotas = () => {
  const { asignaturaId } = useParams();
  const navigate = useNavigate();
  const [notas, setNotas] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [promedioGeneral, setPromedioGeneral] = useState(null);
  const [promediosPorAsignatura, setPromediosPorAsignatura] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsignatura, setSelectedAsignatura] = useState(asignaturaId || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAsignaturas, setExpandedAsignaturas] = useState(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notasData, asignaturasData, promedioData, promediosAsignaturaData] = await Promise.all([
        alumnoService.getMisNotas(),
        alumnoService.getMisAsignaturas(),
        alumnoService.getMiPromedio(),
        alumnoService.getPromedioPorAsignatura()
      ]);
      
      setNotas(notasData);
      setAsignaturas(asignaturasData);
      setPromedioGeneral(promedioData);
      setPromediosPorAsignatura(promediosAsignaturaData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotasFiltradas = () => {
    let notasFiltradas = notas;

    if (selectedAsignatura) {
      notasFiltradas = notasFiltradas.filter(nota => nota.asignatura_id === parseInt(selectedAsignatura));
    }

    if (searchTerm) {
      notasFiltradas = notasFiltradas.filter(nota =>
        nota.asignatura?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return notasFiltradas;
  };

  const getAsignaturasConNotas = () => {
    const notasFiltradas = getNotasFiltradas();
    const asignaturasMap = new Map();
    
    notasFiltradas.forEach(nota => {
      if (!asignaturasMap.has(nota.asignatura_id)) {
        asignaturasMap.set(nota.asignatura_id, {
          id: nota.asignatura_id,
          nombre: nota.asignatura?.nombre,
          docente: nota.asignatura?.docente?.nombre_completo,
          notas: []
        });
      }
      asignaturasMap.get(nota.asignatura_id).notas.push(nota);
    });
    
    return Array.from(asignaturasMap.values());
  };

  const getEstadoNota = (calificacion) => {
    if (calificacion >= 13) return { texto: 'Aprobado', color: 'green' };
    if (calificacion >= 10) return { texto: 'Recuperación', color: 'yellow' };
    return { texto: 'Desaprobado', color: 'red' };
  };

  const getColorNota = (calificacion) => {
    if (calificacion >= 13) return 'text-green-600';
    if (calificacion >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const toggleAsignaturaExpansion = (asignaturaId) => {
    setExpandedAsignaturas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(asignaturaId)) {
        newSet.delete(asignaturaId);
      } else {
        newSet.add(asignaturaId);
      }
      return newSet;
    });
  };

  const getNotasPorAsignatura = (asignaturaId) => {
    return notas.filter(nota => nota.asignatura_id === asignaturaId);
  };

  const calcularPromediosPorAsignatura = (notasAsignatura) => {
    // Filtrar solo notas publicadas
    const notasPublicadas = notasAsignatura.filter(nota => nota.publicada);
    
    // Clasificar notas por tipo
    const actividades = notasPublicadas.filter(nota => 
      ['participacion', 'tarea', 'quiz', 'exposicion', 'laboratorio', 'trabajo_grupal'].includes(nota.tipo_nota)
    );
    
    const practicas = notasPublicadas.filter(nota => 
      nota.tipo_nota === 'practica'
    );
    
    const parciales = notasPublicadas.filter(nota => 
      nota.tipo_nota === 'examen_parcial'
    );
    
    const examenFinal = notasPublicadas.find(nota => 
      nota.tipo_nota === 'examen_final'
    );
    
    const proyectos = notasPublicadas.filter(nota => 
      nota.tipo_nota === 'proyecto'
    );
    
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
    
    const promedioProyectos = proyectos.length > 0 
      ? proyectos.reduce((sum, nota) => sum + nota.calificacion, 0) / proyectos.length 
      : 0;
    
    // Promedio final dinámico: si hay proyectos, dividir entre 5; si no, entre 4
    let sumaPromedios = promedioActividades + promedioPracticas + promedioParciales + notaExamenFinal;
    let divisor = 4;
    let formulaTexto = "(Actividades + Prácticas + Parciales + Examen Final) ÷ 4";
    
    if (proyectos.length > 0) {
      sumaPromedios += promedioProyectos;
      divisor = 5;
      formulaTexto = "(Actividades + Prácticas + Parciales + Examen Final + Proyectos) ÷ 5";
    }
    
    const promedioFinal = sumaPromedios / divisor;
    
    return {
      promedioActividades,
      promedioPracticas,
      promedioParciales,
      notaExamenFinal,
      promedioProyectos,
      promedioFinal,
      cantidadActividades: actividades.length,
      cantidadPracticas: practicas.length,
      cantidadParciales: parciales.length,
      tieneExamenFinal: !!examenFinal,
      cantidadProyectos: proyectos.length,
      formulaTexto
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const notasFiltradas = getNotasFiltradas();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {asignaturaId && (
            <button
              onClick={() => navigate('/alumno/asignaturas')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Volver a Asignaturas</span>
            </button>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Notas</h1>
      </div>

      {/* Estadísticas generales */}
      {/* {promedioGeneral && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Promedio General</p>
                <p className="text-2xl font-semibold text-gray-900">{promedioGeneral.promedio}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Notas</p>
                <p className="text-2xl font-semibold text-gray-900">{promedioGeneral.total_notas}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Award className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Nota Máxima</p>
                <p className="text-2xl font-semibold text-gray-900">{promedioGeneral.nota_maxima}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Nota Mínima</p>
                <p className="text-2xl font-semibold text-gray-900">{promedioGeneral.nota_minima}</p>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Filtros */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Asignatura
            </label>
            <select
              className="input-field"
              value={selectedAsignatura}
              onChange={(e) => setSelectedAsignatura(e.target.value)}
            >
              <option value="">Todas las asignaturas</option>
              {asignaturas.map((asignatura) => (
                <option key={asignatura.id} value={asignatura.id}>
                  {asignatura.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por asignatura..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Notas con Expansión */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Mis Calificaciones
        </h2>
        
        {(() => {
          const asignaturasConNotas = getAsignaturasConNotas();
          
          if (asignaturasConNotas.length === 0) {
            return (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay notas disponibles</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedAsignatura ? 'No tienes notas en esta asignatura.' : 'No tienes notas registradas.'}
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              {asignaturasConNotas.map((asignatura) => {
                const isExpanded = expandedAsignaturas.has(asignatura.id);
                const promedios = calcularPromediosPorAsignatura(asignatura.notas);
                
                return (
                  <div key={asignatura.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Fila principal de la asignatura */}
                    <div 
                      className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleAsignaturaExpansion(asignatura.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-500" />
                          )}
                          <BookOpen className="h-5 w-5 text-gray-400" />
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{asignatura.nombre}</h3>
                            <p className="text-sm text-gray-500">{asignatura.docente}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">{asignatura.notas.length} nota(s)</div>
                          <div className={`text-lg font-bold ${
                            promedios.promedioFinal >= 13 ? 'text-green-600' :
                            promedios.promedioFinal >= 10 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {promedios.promedioFinal > 0 ? promedios.promedioFinal.toFixed(2) : '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notas expandidas */}
                    {isExpanded && (
                      <div className="bg-white">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Tipo de Evaluación
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Calificación
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Fecha
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {asignatura.notas.map((nota) => {
                                const estado = getEstadoNota(nota.calificacion);
                                return (
                                  <tr key={nota.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {nota.tipo_nota.replace('_', ' ')}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`text-sm font-semibold ${getColorNota(nota.calificacion)}`}>
                                        {nota.calificacion}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        estado.color === 'green' ? 'bg-green-100 text-green-800' :
                                        estado.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {estado.texto}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {new Date(nota.fecha_registro).toLocaleDateString()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Resumen de Promedios Detallado */}
                        <div className="bg-gray-50 rounded-lg p-4 m-4">
                          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                            📊 Resumen de Promedios - {asignatura.nombre}
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            {/* Promedio de Actividades */}
                            <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-100">
                              <div className="text-xs text-gray-600 mb-1">
                                📝 Actividades ({promedios.cantidadActividades})
                              </div>
                              <div className="text-lg font-bold text-purple-600">
                                {promedios.promedioActividades > 0 ? promedios.promedioActividades.toFixed(2) : '-'}
                              </div>
                            </div>
                            
                            {/* Promedio de Prácticas */}
                            <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100">
                              <div className="text-xs text-gray-600 mb-1">
                                🔬 Prácticas ({promedios.cantidadPracticas})
                              </div>
                              <div className="text-lg font-bold text-blue-600">
                                {promedios.promedioPracticas > 0 ? promedios.promedioPracticas.toFixed(2) : '-'}
                              </div>
                            </div>
                            
                            {/* Promedio de Parciales */}
                            <div className="bg-white rounded-lg p-3 shadow-sm border border-orange-100">
                              <div className="text-xs text-gray-600 mb-1">
                                📋 Parciales ({promedios.cantidadParciales})
                              </div>
                              <div className="text-lg font-bold text-orange-600">
                                {promedios.promedioParciales > 0 ? promedios.promedioParciales.toFixed(2) : '-'}
                              </div>
                            </div>
                            
                            {/* Examen Final */}
                            <div className="bg-white rounded-lg p-3 shadow-sm border border-red-100">
                              <div className="text-xs text-gray-600 mb-1">
                                📝 Examen Final
                              </div>
                              <div className="text-lg font-bold text-red-600">
                                {promedios.tieneExamenFinal ? promedios.notaExamenFinal.toFixed(2) : '-'}
                              </div>
                            </div>
                            
                            {/* Promedio de Proyectos - Solo mostrar si hay proyectos */}
                            {promedios.cantidadProyectos > 0 && (
                              <div className="bg-white rounded-lg p-3 shadow-sm border border-indigo-100">
                                <div className="text-xs text-gray-600 mb-1">
                                  🎯 Proyectos ({promedios.cantidadProyectos})
                                </div>
                                <div className="text-lg font-bold text-indigo-600">
                                  {promedios.promedioProyectos.toFixed(2)}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Promedio Final Calculado */}
                          <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 shadow-md border-2 border-green-300">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-bold text-gray-700 mb-1">
                                  🏆 PROMEDIO FINAL
                                </div>
                                <div className="text-xs text-gray-600">
                                  {promedios.formulaTexto}
                                </div>
                                {promedios.promedioFinal > 0 && (
                                  <div className={`mt-1 text-xs font-semibold ${
                                    promedios.promedioFinal >= 13 ? 'text-green-700' :
                                    promedios.promedioFinal >= 10 ? 'text-yellow-700' :
                                    'text-red-700'
                                  }`}>
                                    Estado: {promedios.promedioFinal >= 13 ? '✅ Aprobado' :
                                            promedios.promedioFinal >= 10 ? '⚠️ Recuperación' :
                                            '❌ Desaprobado'}
                                  </div>
                                )}
                              </div>
                              <div className={`text-3xl font-bold ${
                                promedios.promedioFinal >= 13 ? 'text-green-700' :
                                promedios.promedioFinal >= 10 ? 'text-yellow-700' :
                                'text-red-700'
                              }`}>
                                {promedios.promedioFinal > 0 ? promedios.promedioFinal.toFixed(2) : '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Resumen de Promedios por Asignatura */}
      {selectedAsignatura && notasFiltradas.length > 0 && (() => {
        const promedios = calcularPromediosPorAsignatura(notasFiltradas);
        return (
          <div className="card">
            {/* <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              📊 Resumen de Promedios - {asignaturas.find(a => a.id === parseInt(selectedAsignatura))?.nombre}
            </h2> */}
            
            {/* <div className="space-y-4"> */}
              {/* <div className="grid grid-cols-2 gap-4"> */}
                {/* Promedio de Actividades */}
                {/* <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                  <div className="text-sm text-gray-600 mb-2 flex items-center">
                    📝 Actividades ({promedios.cantidadActividades})
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {promedios.promedioActividades > 0 ? promedios.promedioActividades.toFixed(2) : '-'}
                  </div>
                </div> */}
                
                {/* Promedio de Prácticas */}
                {/* <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                  <div className="text-sm text-gray-600 mb-2 flex items-center">
                    🔬 Prácticas ({promedios.cantidadPracticas})
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {promedios.promedioPracticas > 0 ? promedios.promedioPracticas.toFixed(2) : '-'}
                  </div>
                </div> */}
                
                {/* Promedio de Parciales */}
                {/* <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-100">
                  <div className="text-sm text-gray-600 mb-2 flex items-center">
                    📋 Parciales ({promedios.cantidadParciales})
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {promedios.promedioParciales > 0 ? promedios.promedioParciales.toFixed(2) : '-'}
                  </div>
                </div> */}
                
                {/* Examen Final */}
                {/* <div className="bg-white rounded-lg p-4 shadow-sm border border-red-100">
                  <div className="text-sm text-gray-600 mb-2 flex items-center">
                    📝 Examen Final
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {promedios.tieneExamenFinal ? promedios.notaExamenFinal.toFixed(2) : '-'}
                  </div>
                </div> */}
              {/* </div> */}
              
              {/* Promedio Final */}
              {/* <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-6 shadow-md border-2 border-green-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-gray-700 mb-2 flex items-center">
                      🏆 PROMEDIO FINAL
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {promedios.formulaTexto}
                    </div>
                    {promedios.promedioFinal > 0 && (
                      <div className={`text-sm font-semibold ${
                        promedios.promedioFinal >= 13 ? 'text-green-700' :
                        promedios.promedioFinal >= 10 ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        Estado: {promedios.promedioFinal >= 13 ? '✅ Aprobado' :
                                promedios.promedioFinal >= 10 ? '⚠️ Recuperación' :
                                '❌ Desaprobado'}
                      </div>
                    )}
                  </div>
                  <div className={`text-4xl font-bold ${
                    promedios.promedioFinal >= 13 ? 'text-green-700' :
                    promedios.promedioFinal >= 10 ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {promedios.promedioFinal > 0 ? promedios.promedioFinal.toFixed(2) : '-'}
                  </div>
                </div>
              </div> */}
            </div>
          // </div>
        );
      })()}

      {/* Promedios por asignatura */}
      {/* {promediosPorAsignatura.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Promedios por Asignatura</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promediosPorAsignatura.map((promedio) => (
              <div key={promedio.asignatura_id} className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">{promedio.asignatura_nombre}</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Promedio:</span>
                    <span className="font-semibold text-gray-900">{promedio.promedio}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Notas:</span>
                    <span className="text-gray-900">{promedio.total_notas}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Máxima:</span>
                    <span className="text-gray-900">{promedio.nota_maxima}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Mínima:</span>
                    <span className="text-gray-900">{promedio.nota_minima}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )} */}
    </div>
  );
};

export default AlumnoNotas;
