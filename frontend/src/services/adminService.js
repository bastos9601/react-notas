import api from './api';

export const adminService = {
  // Gestión de Alumnos
  async getAlumnos() {
    const response = await api.get('/admin/alumnos');
    return response.data;
  },

  async createAlumno(alumnoData) {
    const response = await api.post('/admin/alumnos', alumnoData);
    return response.data;
  },

  async getAlumno(id) {
    const response = await api.get(`/admin/alumnos/${id}`);
    return response.data;
  },

  async updateAlumno(id, alumnoData) {
    const response = await api.put(`/admin/alumnos/${id}`, alumnoData);
    return response.data;
  },

  async deleteAlumno(id) {
    const response = await api.delete(`/admin/alumnos/${id}`);
    return response.data;
  },

  async enviarContrasenaAlumno(id) {
    const response = await api.post(`/admin/alumnos/${id}/enviar-contrasena`);
    return response.data;
  },
  
  // Registrar siguiente ciclo (no matricular, solo actualizar campo ciclo)
  async registrarSiguienteCicloAlumno(id) {
    const response = await api.post(`/admin/alumnos/${id}/registrar-siguiente-ciclo`);
    return response.data;
  },

  async registrarSiguienteCicloTodos() {
    const response = await api.post(`/admin/matricula-automatica/todos`);
    return response.data;
  },

  // Gestión de Docentes
  async getDocentes() {
    const response = await api.get('/admin/docentes');
    return response.data;
  },

  async createDocente(docenteData) {
    const response = await api.post('/admin/docentes', docenteData);
    return response.data;
  },

  async getDocente(id) {
    const response = await api.get(`/admin/docentes/${id}`);
    return response.data;
  },

  async updateDocente(id, docenteData) {
    console.log('Enviando PUT request a:', `/admin/docentes/${id}`);
    console.log('Datos:', docenteData);
    const response = await api.put(`/admin/docentes/${id}`, docenteData);
    return response.data;
  },

  async deleteDocente(id) {
    const response = await api.delete(`/admin/docentes/${id}`);
    return response.data;
  },

  async enviarContrasenaDocente(id) {
    const response = await api.post(`/admin/docentes/${id}/enviar-contrasena`);
    return response.data;
  },

  // Gestión de Asignaturas
  async getAsignaturas(ciclo = null) {
    const url = ciclo ? `/admin/asignaturas?ciclo=${ciclo}` : '/admin/asignaturas';
    const response = await api.get(url);
    return response.data;
  },

  async createAsignatura(asignaturaData) {
    const response = await api.post('/admin/asignaturas', asignaturaData);
    return response.data;
  },

  async getAsignatura(id) {
    const response = await api.get(`/admin/asignaturas/${id}`);
    return response.data;
  },

  async updateAsignatura(id, asignaturaData) {
    const response = await api.put(`/admin/asignaturas/${id}`, asignaturaData);
    return response.data;
  },

  async deleteAsignatura(id) {
    const response = await api.delete(`/admin/asignaturas/${id}`);
    return response.data;
  },

  // Gestión de Matrículas
  async getMatriculas() {
    const response = await api.get('/admin/matriculas');
    return response.data;
  },

  async createMatricula(matriculaData) {
    const response = await api.post('/admin/matriculas', matriculaData);
    return response.data;
  },

  async deleteMatricula(alumnoId, asignaturaId) {
    const response = await api.delete(`/admin/matriculas/${alumnoId}/${asignaturaId}`);
    return response.data;
  },

  // Gestión de Notas
  async getNotas() {
    const response = await api.get('/admin/notas');
    return response.data;
  },

  // Dashboard
  async getDashboard() {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // Mi Perfil
  async actualizarMiPerfil(perfilData) {
    const response = await api.put('/admin/mi-perfil', perfilData);
    return response.data;
  },

  // Historial Académico
  async getHistorialAcademicoAlumno(alumnoId) {
    const response = await api.get(`/historial/alumnos/${alumnoId}/historial`);
    return response.data;
  }
};
