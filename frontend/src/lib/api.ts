import axios from 'axios';

// Crear una instancia de Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

// Interceptor de solicitudes para añadir el token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuestas para manejar errores 401 (No Autorizado)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Eliminar el token si ha expirado y redirigir al login
      localStorage.removeItem('token');
      // Asegurarse de no causar un bucle infinito de redirecciones
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (username: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    
    const response = await api.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // Guardar el token en localStorage al iniciar sesión
    if (response.data && response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
  },
  getRequests: async () => {
    const response = await api.get('/auth/requests');
    return response.data;
  },
  denyRequest: async (id: string) => {
    const response = await api.post(`/auth/requests/${id}/deny`);
    return response.data;
  },
  getBlocked: async () => {
    const response = await api.get('/auth/blocked');
    return response.data;
  },
  unblock: async (id: string) => {
    const response = await api.delete(`/auth/blocked/${id}`);
    return response.data;
  }
};


export const usersApi = {
  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/users/');
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  getRoles: async () => {
    const response = await api.get('/users/roles/all');
    return response.data;
  },
  approve: async (id: string, rolId: number) => {
    const response = await api.put(`/users/${id}/approve?rol_id=${rolId}`);
    return response.data;
  },
  requestAccess: async (data: any) => {
    const backendData = {
      primer_nombre: data.firstName,
      segundo_nombre: '',
      primer_apellido: data.lastName,
      segundo_apellido: '',
      celular: data.phone,
      correo_personal: data.personalEmail,
      correo_institucional: data.institutionalEmail,
      username: data.username,
      password: data.password
    };
    const response = await api.post('/users/request-access', backendData);
    return response.data;
  }
};

export const casesApi = {
  getAll: async () => {
    const response = await api.get('/cases/');
    return response.data;
  },
  getPriorities: async () => {
    const response = await api.get('/cases/priorities');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/cases/${id}`);
    return response.data;
  },
  addObservation: async (data: { caso_id: string, comentario: string, enviar_correo: boolean }) => {
    const response = await api.post('/cases/observacion', data);
    return response.data;
  },
  finalizeCase: async (id: string, comment: string, sendEmail: boolean) => {
    const response = await api.post(`/cases/finalizar/${id}?comentario=${encodeURIComponent(comment)}&enviar_correo=${sendEmail}`);
    return response.data;
  },
  updatePriority: async (id: string, priorityId: number) => {
    const response = await api.put(`/cases/${id}/priority?prioridad_id=${priorityId}`);
    return response.data;
  }
};



export const dashboardApi = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }
};

export const notificationApi = {

  getAll: async () => {
    const response = await api.get('/notifications/');
    return response.data;
  },
  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
};

export default api;

