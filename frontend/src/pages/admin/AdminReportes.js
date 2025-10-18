import React, { useEffect, useState } from 'react';
import { BarChart, FileSpreadsheet, FileText, Download, Eye, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminReportes = () => {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportes = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.get('/admin/reportes');
        setReportes(resp.data || []);
      } catch (err) {
        console.error('Error al cargar reportes:', err);
        setError('No se pudieron cargar los reportes.');
      } finally {
        setLoading(false);
      }
    };
    fetchReportes();
  }, []);

  const handleDescargar = async (reporte) => {
    try {
      const resp = await api.get(`/admin/reportes/${reporte.id}/archivo`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a');
      link.href = url;
      const nombre = reporte.archivo_path?.split('\\').pop() || reporte.archivo_path?.split('/').pop() || `reporte_${reporte.id}.csv`;
      link.setAttribute('download', nombre);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar archivo:', err);
      alert('No fue posible descargar el archivo del reporte.');
    }
  };

  const handleVer = async (reporte) => {
    try {
      const resp = await api.get(`/admin/reportes/${reporte.id}/archivo`, { responseType: 'blob' });

      // Detectar tipo de archivo por cabecera o extensión
      const contentType = (resp.headers && (resp.headers['content-type'] || resp.headers['Content-Type'])) || resp.data?.type || '';
      const ext = (reporte.archivo_path || '').split('.').pop()?.toLowerCase() || '';
      const isPdf = contentType.includes('pdf') || ext === 'pdf';

      if (isPdf) {
        // Abrir el PDF directamente
        const pdfUrl = window.URL.createObjectURL(resp.data);
        window.open(pdfUrl, '_blank');
        return;
      }

      // Si no es PDF, asumir CSV/texto y renderizar un PDF con jsPDF
      const blobToText = (blob) => {
        if (blob && typeof blob.text === 'function') {
          return blob.text();
        }
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsText(blob);
        });
      };

      const text = await blobToText(resp.data);
      const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const lines = normalized.split('\n').filter(l => l.trim().length > 0);
      if (lines.length === 0) {
        alert('El reporte está vacío.');
        return;
      }
      const firstLine = lines[0];
      const delimiter = firstLine.includes(';') ? ';' : (firstLine.includes('\t') ? '\t' : ',');
      const headers = firstLine.split(delimiter).map(h => h.trim());
      const rows = lines.slice(1).map(line => line.split(delimiter).map(c => c.trim()));

      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

      doc.setFontSize(16);
      doc.text('Reporte de Notas', 40, 40);
      doc.setFontSize(12);
      const meta = [
        `Docente: ${reporte.nombre_docente || '-'}`,
        `Asignatura: ${reporte.asignatura || '-'}`,
        `Tipo evaluación: ${reporte.tipo_evaluacion || '-'}`,
        `Fecha envío: ${new Date(reporte.fecha_envio).toLocaleString()}`
      ];
      let y = 60;
      meta.forEach(m => { doc.text(m, 40, y); y += 16; });

      autoTable(doc, {
        startY: y + 8,
        head: [headers],
        body: rows,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255] },
        columnStyles: (() => {
          const idx = headers.findIndex(h => /calific/i.test(h));
          return idx >= 0 ? { [idx]: { halign: 'center' } } : {};
        })(),
        didParseCell: (data) => {
          const gradeColIdx = headers.findIndex(h => /calific/i.test(h));
          if (data.section === 'body' && data.column.index === gradeColIdx) {
            const rawText = Array.isArray(data.cell.text) ? data.cell.text.join(' ') : String(data.cell.text || data.cell.raw || '');
            const normalizedTxt = rawText.replace(',', '.');
            const match = normalizedTxt.match(/-?\d+(?:\.\d+)?/);
            const grade = match ? parseFloat(match[0]) : NaN;

            if (!Number.isNaN(grade)) {
              if (grade >= 13 && grade <= 20) {
                data.cell.styles.textColor = [34, 197, 94];
              } else if (grade >= 10 && grade < 13) {
                data.cell.styles.textColor = [234, 179, 8];
              } else if (grade >= 5 && grade < 10) {
                data.cell.styles.textColor = [239, 68, 68];
              }
            }
          }
        }
      });

      const blob = doc.output('blob');
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error al generar PDF:', err);
      alert('No fue posible generar el PDF del reporte.');
    }
  };

  const handleEliminar = async (reporte) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar este reporte? Esta acción no se puede deshacer.');
    if (!confirmar) return;
    try {
      await api.delete(`/admin/reportes/${reporte.id}`);
      setReportes((prev) => prev.filter((x) => x.id !== reporte.id));
    } catch (err) {
      console.error('Error al eliminar reporte:', err);
      alert('No fue posible eliminar el reporte.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <BarChart className="mr-3 h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-semibold">Reportes</h1>
        </div>
        <p className="text-gray-600">
          Panel de reportes . Aquí podrás recibir los reportes del Docente .
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        

        
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Reportes enviados por docentes</h2>
          {loading && <span className="text-sm text-gray-500">Cargando...</span>}
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4">
            {error}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Docente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignatura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo evaluación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha envío</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportes.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-500" colSpan="5">
                    No hay reportes enviados aún.
                  </td>
                </tr>
              ) : (
                reportes.map((r) => (
                  <tr key={r.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.nombre_docente}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.asignatura}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.tipo_evaluacion}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(r.fecha_envio).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {/*  */}
                      <button
                        className="inline-flex items-center px-3 py-2 rounded bg-gray-700 text-white hover:bg-gray-800"
                        onClick={() => handleVer(r)}
                        title="Ver PDF"
                      >
                        <Eye className="mr-2 h-4 w-4" /> 
                      </button>
                      <button
                        className="inline-flex items-center px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                        onClick={() => handleEliminar(r)}
                        title="Eliminar reporte"
                      >
                        <Trash className="mr-2 h-4 w-4" /> 
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReportes;