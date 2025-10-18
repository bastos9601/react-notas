import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { FileText, FileSpreadsheet, Mail } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DocenteReportes = () => {
  const { user } = useAuth();
  const [asignaturas, setAsignaturas] = useState([]);
  const [selectedAsignatura, setSelectedAsignatura] = useState('');
  const [tiposEvaluacion, setTiposEvaluacion] = useState([]);
  const [selectedTipoEvaluacion, setSelectedTipoEvaluacion] = useState('');
  const [reporteData, setReporteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailToSend, setEmailToSend] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Cargar asignaturas al iniciar
  useEffect(() => {
    const fetchAsignaturas = async () => {
      try {
        const response = await api.get('/docente/mis-asignaturas');
        setAsignaturas(response.data);
      } catch (error) {
        console.error('Error al cargar asignaturas:', error);
        setError('Error al cargar las asignaturas. Por favor, intente nuevamente.');
      }
    };

    fetchAsignaturas();
  }, []);

  // Cargar tipos de evaluación al iniciar
  useEffect(() => {
    const fetchTiposEvaluacion = async () => {
      try {
        const response = await api.get('/docente/tipos-evaluacion');
        setTiposEvaluacion(response.data);
        if (response.data && response.data.length > 0) {
          setSelectedTipoEvaluacion(response.data[0].id);
        }
      } catch (error) {
        console.error('Error al cargar tipos de evaluación:', error);
        setError('Error al cargar los tipos de evaluación. Por favor, intente nuevamente.');
      }
    };

    fetchTiposEvaluacion();
  }, []);
  
  // Cargar reporte cuando se selecciona una asignatura y tipo de evaluación
  useEffect(() => {
    const fetchReporte = async () => {
      if (!selectedAsignatura || !selectedTipoEvaluacion) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Obtener el nombre de la asignatura
        const asignaturaInfo = asignaturas.find(a => a.id.toString() === selectedAsignatura.toString());
        
        // Encontrar el tipo de evaluación seleccionado
        const tipoEvaluacionInfo = tiposEvaluacion.find(t => t.id === selectedTipoEvaluacion);
        
        // Usar el endpoint específico para reportes
        const reporteResponse = await api.get(`/docente/reportes/${selectedAsignatura}/${tipoEvaluacionInfo?.nombre || ''}`);
        const reporteResult = reporteResponse.data || {};
        
        console.log("Datos completos del reporte:", JSON.stringify(reporteResult, null, 2));
        
        // Crear el reporte con los datos obtenidos
        setReporteData({
          asignatura: reporteResult.asignatura || asignaturaInfo?.nombre || 'Asignatura',
          tipoEvaluacion: reporteResult.tipo_evaluacion || tipoEvaluacionInfo?.nombre || 'Evaluación',
          alumnos: (reporteResult.reporte || []).map(alumnoData => {
            console.log("Datos de alumno:", alumnoData);
            return {
              id: alumnoData.alumno_id || 'unknown',
              nombre_alumno: alumnoData.alumno || 'Sin nombre',
              ciclo: alumnoData.ciclo || '-',
              asignatura: alumnoData.asignatura || reporteResult.asignatura || asignaturaInfo?.nombre || '-',
              calificacion: alumnoData.calificacion === null ? '-' : alumnoData.calificacion
            };
          })
        });
      } catch (error) {
        console.error('Error al cargar reporte:', error);
        setError('Error al cargar el reporte. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchReporte();
  }, [selectedAsignatura, selectedTipoEvaluacion, asignaturas, tiposEvaluacion]);

  const handleEnviarReporte = async () => {
    if (!selectedAsignatura || !selectedTipoEvaluacion) {
      setError('Por favor, seleccione una asignatura y un tipo de evaluación para enviar el reporte.');
      return;
    }

    try {
      // Encontrar el tipo de evaluación seleccionado
      const tipoEvaluacionInfo = tiposEvaluacion.find(t => t.id === selectedTipoEvaluacion);
      
      // Obtener el reporte actual
      const reporteResponse = await api.get(`/docente/reportes/${selectedAsignatura}/${tipoEvaluacionInfo?.nombre || ''}`);
      const reporteData = reporteResponse.data || {};
      
      // Enviar el reporte al administrador
      await api.post('/docente/reportes/enviar-admin', reporteData);
      alert('Reporte enviado correctamente al administrador.');
    } catch (error) {
      console.error('Error al enviar reporte:', error);
      setError('Error al enviar el reporte. Por favor, intente nuevamente.');
    }
  };

  const handleOpenEmailModal = () => {
    if (!selectedAsignatura || !selectedTipoEvaluacion) {
      setError('Por favor, seleccione una asignatura y un tipo de evaluación para enviar el reporte.');
      return;
    }
    setEmailError('');
    setEmailToSend('');
    setShowEmailModal(true);
  };

  const handleEnviarPorCorreo = async () => {
    setEmailError('');
    if (!reporteData) {
      setError('No hay datos de reporte para enviar.');
      return;
    }
    const simpleEmailRegex = /.+@.+\..+/;
    if (!emailToSend || !simpleEmailRegex.test(emailToSend)) {
      setEmailError('Ingrese un correo válido.');
      return;
    }
    setSendingEmail(true);
    try {
      const payload = {
        email: emailToSend,
        asignatura: reporteData.asignatura,
        tipo_evaluacion: reporteData.tipoEvaluacion,
        reporte: (reporteData.alumnos || []).map((al) => ({
          alumno: al.nombre_alumno,
          ciclo: al.ciclo,
          asignatura: al.asignatura,
          tipo_evaluacion: reporteData.tipoEvaluacion,
          calificacion: al.calificacion === '-' ? '' : al.calificacion,
        })),
      };
      await api.post('/docente/reportes/enviar-email', payload);
      alert(`Reporte enviado correctamente a ${emailToSend}.`);
      setShowEmailModal(false);
    } catch (err) {
      console.error('Error al enviar por correo:', err);
      setEmailError('Error al enviar el reporte por correo. Intente nuevamente.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleExportarExcel = () => {
    if (!reporteData) {
      setError('No hay datos para exportar.');
      return;
    }
    
    // Aquí iría la lógica para exportar a Excel
    alert('Exportación a Excel no implementada aún.');
  };

  const handleExportarPDF = () => {
    if (!reporteData) {
      setError('No hay datos para exportar.');
      return;
    }
    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });

      const brandColor = [37, 99, 235];
      const titulo = 'Sistema de Notas';
      const subtitulo = `Reporte: ${reporteData.tipoEvaluacion} - ${reporteData.asignatura}`;
      const docenteNombre = user?.nombre || user?.nombre_completo || 'Docente';
      const fecha = new Date().toLocaleString();

      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(...brandColor);
      doc.rect(0, 0, pageWidth, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text(titulo, 14, 12);
      doc.setFontSize(11);
      doc.text(subtitulo, 14, 18);

      doc.setTextColor(33, 33, 33);
      doc.setFontSize(11);
      doc.text(`Docente: ${docenteNombre}`, 14, 28);
      doc.text(`Fecha: ${fecha}`, 14, 34);
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 38, pageWidth - 14, 38);

      const head = [[
        'Alumno',
        'Ciclo',
        'Asignatura',
        'Tipo de Evaluación',
        'Calificación'
      ]];

      const body = (reporteData.alumnos || []).map((al) => [
        al.nombre_alumno,
        al.ciclo,
        al.asignatura,
        reporteData.tipoEvaluacion,
        typeof al.calificacion === 'number' ? Number(al.calificacion).toFixed(2) : String(al.calificacion)
      ]);

      autoTable(doc, {
        head,
        body,
        startY: 42,
        margin: { left: 14, right: 14, top: 42 },
        styles: { fontSize: 10, cellPadding: 3, textColor: 33 },
        headStyles: { fillColor: brandColor, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        theme: 'grid',
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 16, halign: 'center' },
          2: { cellWidth: 40 },
          3: { cellWidth: 35 },
          4: { cellWidth: 25, halign: 'right' }
        },
        didDrawPage: (data) => {
          const pw = doc.internal.pageSize.getWidth();
          const ph = doc.internal.pageSize.getHeight();
          doc.setFontSize(9);
          doc.setTextColor(130, 130, 130);
          doc.text(`Página ${data.pageNumber}`, 14, ph - 10);
          doc.text('© Sistema de Notas', pw - 14, ph - 10, { align: 'right' });
        }
      });

      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 42;
      const total = (reporteData.alumnos || []).length;
      doc.setFontSize(11);
      doc.setTextColor(33, 33, 33);
      doc.text(`Total alumnos: ${total}`, 14, finalY + 8);

      const safeAsignatura = (reporteData.asignatura || 'asignatura').replace(/\s+/g, '_');
      const safeTipo = (reporteData.tipoEvaluacion || 'evaluacion').replace(/\s+/g, '_');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
      const fileName = `Reporte_${safeAsignatura}_${safeTipo}_${timestamp}.pdf`;

      doc.save(fileName);
    } catch (err) {
      console.error('Error generando PDF:', err);
      setError('Ocurrió un error generando el PDF.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reportes de Notas</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Generar Reporte</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asignatura</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={selectedAsignatura}
              onChange={(e) => setSelectedAsignatura(e.target.value)}
            >
              <option value="">Seleccione una asignatura</option>
              {asignaturas.map((asignatura) => (
                <option key={asignatura.id} value={asignatura.id}>
                  {asignatura.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evaluación</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={selectedTipoEvaluacion}
              onChange={(e) => setSelectedTipoEvaluacion(e.target.value)}
            >
              <option value="">Seleccione un tipo de evaluación</option>
              {tiposEvaluacion.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            className="flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            onClick={handleEnviarReporte}
          >
            <Mail className="mr-2" size={18} />
            Enviar Reporte al Administrador
          </button>
          <button
            className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            onClick={handleOpenEmailModal}
          >
            <Mail className="mr-2" size={18} />
            Enviar por correo
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-4">Cargando reporte...</div>
      ) : reporteData ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">
              Reporte: {reporteData.tipoEvaluacion} - {reporteData.asignatura}
            </h2>
            <div className="flex space-x-2">
              <button
                className="flex items-center bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                onClick={handleExportarExcel}
              >
                <FileSpreadsheet className="mr-1" size={16} />
                Excel
              </button>
              <button
                className="flex items-center bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                onClick={handleExportarPDF}
              >
                <FileText className="mr-1" size={16} />
                PDF
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <p className="text-sm text-gray-500 mb-2">
              Mostrando {reporteData.alumnos.length} alumnos
            </p>
            
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
                      Tipo de Evaluación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Calificación
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reporteData.alumnos.length > 0 ? (
                    reporteData.alumnos.map((alumno) => (
                      <tr key={alumno.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {alumno.nombre_alumno}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {alumno.ciclo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {alumno.asignatura}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {reporteData.tipoEvaluacion}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {alumno.calificacion}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                        No se encontraron alumnos que coincidan con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Seleccione una asignatura y un tipo de evaluación para generar un reporte.
        </div>
      )}

      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-3">Enviar reporte por correo</h3>
            <p className="text-sm text-gray-600 mb-4">
              Ingrese el correo electrónico al que desea enviar el reporte en PDF.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
            <input
              type="email"
              className="w-full p-2 border border-gray-300 rounded-md mb-2"
              placeholder="correo@ejemplo.com"
              value={emailToSend}
              onChange={(e) => setEmailToSend(e.target.value)}
            />
            {emailError && (
              <div className="text-red-600 text-sm mb-2">{emailError}</div>
            )}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => setShowEmailModal(false)}
                disabled={sendingEmail}
              >
                Cancelar
              </button>
              <button
                className={`px-4 py-2 rounded-md text-white ${sendingEmail ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                onClick={handleEnviarPorCorreo}
                disabled={sendingEmail}
              >
                {sendingEmail ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocenteReportes;
