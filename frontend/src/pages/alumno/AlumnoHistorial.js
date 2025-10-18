import React from 'react';
import HistorialAcademico from '../../components/alumno/HistorialAcademico';

const AlumnoHistorial = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Historial Académico</h1>
      </div>
      
      <HistorialAcademico />
    </div>
  );
};

export default AlumnoHistorial;