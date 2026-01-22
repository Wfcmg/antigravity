# Taller: Frontend con Vue.js - Login y Registro de Usuarios

## Información del Taller

| Campo | Detalle |
|-------|---------|
| **Asignatura** | Desarrollo en Plataformas |
| **Tema** | Implementación de Autenticación en Frontend |
| **Prerrequisito** | Backend NestJS con JWT funcionando |
| **Tiempo estimado** | 4-5 horas |
| **Entregable** | Aplicación Vue.js con login, registro y ruta protegida |

---

## Objetivos del Taller

Al finalizar este taller, serás capaz de:

1. Crear un proyecto Vue.js desde cero usando Vite
2. Implementar formularios reactivos para login y registro
3. Consumir una API REST desde el frontend
4. Almacenar y gestionar tokens JWT de forma segura
5. Proteger rutas del frontend según el estado de autenticación

---

## Prerrequisitos Técnicos

Antes de comenzar, verifica que tienes:

- [ ] Node.js versión 18 o superior (`node --version`)
- [ ] npm versión 9 o superior (`npm --version`)
- [ ] Tu backend NestJS del taller anterior corriendo en `http://localhost:3000`
- [ ] Un usuario registrado en tu base de datos para pruebas
- [ ] VS Code con la extensión "Vue - Official" instalada

### Verificación del Backend

Antes de empezar el frontend, confirma que tu backend funciona. Abre Postman y prueba:

```
POST http://localhost:3000/auth/login
Body (JSON):
{
  "email": "tu_email@test.com",
  "password": "tu_password"
}
```

Deberías recibir un `access_token`. Si no funciona, revisa tu backend antes de continuar.

---

## Parte 1: Creación del Proyecto Vue.js

### 1.1 Crear el proyecto con Vite

Abre una terminal y ejecuta:

```bash
# Crear el proyecto (esto tomará unos segundos)
npm create vite@latest auth-frontend -- --template vue

# Entrar al directorio del proyecto
cd auth-frontend

# Instalar dependencias base
npm install
```

### 1.2 Instalar dependencias adicionales

Necesitamos dos librerías extra:

```bash
# Axios: para hacer peticiones HTTP al backend
# Vue Router: para manejar la navegación entre páginas
npm install axios vue-router
```

### 1.3 Verificar que funciona

```bash
npm run dev
```

Abre tu navegador en `http://localhost:5173`. Deberías ver la página de bienvenida de Vue.

**CHECKPOINT 1:** ¿Ves la página de Vue con el logo y un contador? ✅

---

## Parte 2: Estructura del Proyecto

### 2.1 Crear la estructura de carpetas

Dentro de la carpeta `src`, crea las siguientes carpetas:

```
src/
├── components/     (ya existe)
├── views/          (CREAR)
├── router/         (CREAR)
├── services/       (CREAR)
├── assets/         (ya existe)
├── App.vue         (ya existe)
└── main.js         (ya existe)
```

### 2.2 Crear los archivos necesarios

Vamos a crear varios archivos. Por ahora créalos vacíos, los iremos llenando:

**Dentro de `views/`:**
- `LoginView.vue`
- `RegisterView.vue`
- `HomeView.vue`
- `ProfileView.vue`

**Dentro de `router/`:**
- `index.js`

**Dentro de `services/`:**
- `api.js`
- `authService.js`

---

## Parte 3: Configuración del Servicio de API

### 3.1 Crear el cliente Axios

Abre `src/services/api.js` y escribe:

```javascript
/**
 * Archivo: src/services/api.js
 * Propósito: Configurar Axios como cliente HTTP para comunicarse con el backend
 * 
 * Este archivo centraliza la configuración de las peticiones HTTP.
 * Usamos interceptores para agregar automáticamente el token a cada petición.
 */

import axios from 'axios'

// Crear instancia de Axios con configuración base
// baseURL: Todas las peticiones usarán esta URL como prefijo
// Ejemplo: api.get('/auth/login') → GET http://localhost:3000/auth/login
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * INTERCEPTOR DE PETICIONES (Request Interceptor)
 * 
 * Se ejecuta ANTES de cada petición HTTP.
 * Aquí agregamos el token de autenticación si existe.
 */
api.interceptors.request.use(
  (config) => {
    // Buscar el token en localStorage
    const token = localStorage.getItem('access_token')
    
    // Si existe un token, agregarlo al header Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    // Si hay un error en la configuración de la petición
    return Promise.reject(error)
  }
)

/**
 * INTERCEPTOR DE RESPUESTAS (Response Interceptor)
 * 
 * Se ejecuta DESPUÉS de recibir cada respuesta.
 * Útil para manejar errores globales como token expirado.
 */
api.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, simplemente la retornamos
    return response
  },
  (error) => {
    // Si el error es 401 (No autorizado), el token probablemente expiró
    if (error.response && error.response.status === 401) {
      // Limpiar el token inválido
      localStorage.removeItem('access_token')
      
      // Opcional: Redirigir al login
      // window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

// Exportar la instancia configurada para usar en toda la aplicación
export default api
```

### 3.2 Crear el servicio de autenticación

Abre `src/services/authService.js` y escribe:

```javascript
/**
 * Archivo: src/services/authService.js
 * Propósito: Centralizar todas las operaciones relacionadas con autenticación
 * 
 * Este servicio encapsula:
 * - Login de usuarios
 * - Registro de nuevos usuarios
 * - Obtener perfil del usuario autenticado
 * - Logout
 */

import api from './api'

/**
 * Servicio de Autenticación
 * Contiene todos los métodos para manejar la autenticación de usuarios
 */
const authService = {
  
  /**
   * Registrar un nuevo usuario
   * @param {Object} userData - Datos del usuario {email, password, name}
   * @returns {Promise} - Promesa con la respuesta del servidor
   */
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data
    } catch (error) {
      // Re-lanzar el error para manejarlo en el componente
      throw error.response?.data || { message: 'Error de conexión' }
    }
  },

  /**
   * Iniciar sesión
   * @param {Object} credentials - Credenciales {email, password}
   * @returns {Promise} - Promesa con el token de acceso
   */
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials)
      
      // Si el login es exitoso, guardar el token
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token)
      }
      
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Error de conexión' }
    }
  },

  /**
   * Obtener el perfil del usuario autenticado
   * @returns {Promise} - Promesa con los datos del usuario
   */
  async getProfile() {
    try {
      const response = await api.get('/auth/profile')
      return response.data
    } catch (error) {
      throw error.response?.data || { message: 'Error al obtener perfil' }
    }
  },

  /**
   * Cerrar sesión
   * Elimina el token del almacenamiento local
   */
  logout() {
    localStorage.removeItem('access_token')
  },

  /**
   * Verificar si hay un usuario autenticado
   * @returns {boolean} - true si existe un token guardado
   */
  isAuthenticated() {
    return !!localStorage.getItem('access_token')
  },

  /**
   * Obtener el token actual
   * @returns {string|null} - El token o null si no existe
   */
  getToken() {
    return localStorage.getItem('access_token')
  }
}

export default authService
```

**CHECKPOINT 2:** Verifica que los archivos están creados sin errores de sintaxis. El proyecto debe seguir ejecutándose sin problemas. ✅

---

## Parte 4: Crear las Vistas (Páginas)

### 4.1 Vista de Login

Abre `src/views/LoginView.vue` y escribe:

```vue
<!--
  Archivo: src/views/LoginView.vue
  Propósito: Página de inicio de sesión para usuarios existentes
  
  Funcionalidad:
  - Formulario con email y password
  - Validación básica de campos
  - Envío de credenciales al backend
  - Manejo de errores de autenticación
  - Redirección a perfil si el login es exitoso
-->
<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Título de la página -->
      <h1>Iniciar Sesión</h1>
      
      <!-- Mensaje de error (solo se muestra si hay un error) -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- Formulario de login -->
      <!-- @submit.prevent evita el comportamiento por defecto del formulario -->
      <form @submit.prevent="handleLogin">
        
        <!-- Campo de email -->
        <div class="form-group">
          <label for="email">Correo Electrónico</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="correo@ejemplo.com"
            required
            :disabled="isLoading"
          />
        </div>

        <!-- Campo de contraseña -->
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Tu contraseña"
            required
            :disabled="isLoading"
          />
        </div>

        <!-- Botón de submit -->
        <button type="submit" :disabled="isLoading" class="btn-primary">
          <!-- Mostrar texto diferente según el estado de carga -->
          {{ isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <!-- Link para ir a registro -->
      <p class="register-link">
        ¿No tienes cuenta? 
        <router-link to="/register">Regístrate aquí</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
/**
 * Lógica del componente LoginView
 * Usamos Composition API con <script setup>
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import authService from '../services/authService'

// Obtener el router para navegación programática
const router = useRouter()

// Variables reactivas para el formulario
// ref() crea variables que Vue puede observar y actualizar automáticamente
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

/**
 * Manejar el envío del formulario de login
 * Esta función se ejecuta cuando el usuario hace clic en "Iniciar Sesión"
 */
const handleLogin = async () => {
  // Limpiar mensaje de error anterior
  errorMessage.value = ''
  
  // Activar estado de carga (deshabilita el formulario)
  isLoading.value = true

  try {
    // Intentar hacer login con las credenciales
    await authService.login({
      email: email.value,
      password: password.value
    })

    // Si llegamos aquí, el login fue exitoso
    // Redirigir al perfil del usuario
    router.push('/profile')
    
  } catch (error) {
    // Si hay un error, mostrarlo al usuario
    // error.message viene del backend o del servicio
    errorMessage.value = error.message || 'Error al iniciar sesión'
  } finally {
    // Desactivar estado de carga (siempre se ejecuta)
    isLoading.value = false
  }
}
</script>

<style scoped>
/**
 * Estilos específicos para la vista de Login
 * El atributo 'scoped' asegura que estos estilos solo afecten este componente
 */

.login-container {
  /* Centrar verticalmente */
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  padding: 20px;
}

.login-card {
  /* Tarjeta blanca centrada */
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h1 {
  /* Título */
  margin-bottom: 24px;
  text-align: center;
  color: #333;
  font-size: 24px;
}

.form-group {
  /* Grupo de campo (label + input) */
  margin-bottom: 20px;
}

label {
  /* Etiquetas de campos */
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-size: 14px;
  font-weight: 500;
}

input {
  /* Campos de entrada */
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

input:focus {
  /* Efecto al hacer foco en el campo */
  outline: none;
  border-color: #4CAF50;
}

input:disabled {
  /* Estilo cuando el campo está deshabilitado */
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.btn-primary {
  /* Botón principal */
  width: 100%;
  padding: 14px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #45a049;
}

.btn-primary:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  /* Mensaje de error */
  background-color: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
}

.register-link {
  /* Link a registro */
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.register-link a {
  color: #4CAF50;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>
```

### 4.2 Vista de Registro

Abre `src/views/RegisterView.vue` y escribe:

```vue
<!--
  Archivo: src/views/RegisterView.vue
  Propósito: Página de registro para nuevos usuarios
  
  Funcionalidad:
  - Formulario con nombre, email y password
  - Confirmación de contraseña
  - Validación de que las contraseñas coincidan
  - Envío de datos al backend para crear cuenta
  - Redirección a login después de registro exitoso
-->
<template>
  <div class="register-container">
    <div class="register-card">
      <h1>Crear Cuenta</h1>
      
      <!-- Mensaje de éxito -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      
      <!-- Mensaje de error -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleRegister">
        
        <!-- Campo de nombre -->
        <div class="form-group">
          <label for="name">Nombre Completo</label>
          <input
            id="name"
            v-model="name"
            type="text"
            placeholder="Tu nombre"
            required
            :disabled="isLoading"
          />
        </div>

        <!-- Campo de email -->
        <div class="form-group">
          <label for="email">Correo Electrónico</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="correo@ejemplo.com"
            required
            :disabled="isLoading"
          />
        </div>

        <!-- Campo de contraseña -->
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            required
            minlength="6"
            :disabled="isLoading"
          />
        </div>

        <!-- Campo de confirmar contraseña -->
        <div class="form-group">
          <label for="confirmPassword">Confirmar Contraseña</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="Repite tu contraseña"
            required
            :disabled="isLoading"
          />
          <!-- Mensaje de validación de contraseñas -->
          <span v-if="confirmPassword && password !== confirmPassword" class="validation-error">
            Las contraseñas no coinciden
          </span>
        </div>

        <!-- Botón de submit -->
        <button 
          type="submit" 
          :disabled="isLoading || (confirmPassword && password !== confirmPassword)"
          class="btn-primary"
        >
          {{ isLoading ? 'Creando cuenta...' : 'Crear Cuenta' }}
        </button>
      </form>

      <!-- Link para ir a login -->
      <p class="login-link">
        ¿Ya tienes cuenta? 
        <router-link to="/login">Inicia sesión aquí</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import authService from '../services/authService'

const router = useRouter()

// Variables reactivas del formulario
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

/**
 * Manejar el registro de nuevo usuario
 */
const handleRegister = async () => {
  // Validar que las contraseñas coincidan
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Las contraseñas no coinciden'
    return
  }

  // Limpiar mensajes
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    // Intentar registrar al usuario
    await authService.register({
      name: name.value,
      email: email.value,
      password: password.value
    })

    // Registro exitoso
    successMessage.value = '¡Cuenta creada exitosamente! Redirigiendo al login...'
    
    // Esperar 2 segundos y redirigir al login
    setTimeout(() => {
      router.push('/login')
    }, 2000)

  } catch (error) {
    errorMessage.value = error.message || 'Error al crear la cuenta'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Los estilos son similares al login, con algunas adiciones */

.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  padding: 20px;
}

.register-card {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h1 {
  margin-bottom: 24px;
  text-align: center;
  color: #333;
  font-size: 24px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-size: 14px;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #2196F3;
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1976D2;
}

.btn-primary:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
}

.success-message {
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
}

.validation-error {
  color: #c62828;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.login-link a {
  color: #2196F3;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
```

### 4.3 Vista de Perfil (Protegida)

Abre `src/views/ProfileView.vue` y escribe:

```vue
<!--
  Archivo: src/views/ProfileView.vue
  Propósito: Página de perfil del usuario autenticado
  
  Esta página solo es accesible para usuarios autenticados.
  Muestra los datos del usuario obtenidos del endpoint protegido /auth/profile
-->
<template>
  <div class="profile-container">
    <div class="profile-card">
      <h1>Mi Perfil</h1>
      
      <!-- Estado de carga -->
      <div v-if="isLoading" class="loading">
        Cargando información del perfil...
      </div>

      <!-- Mensaje de error -->
      <div v-else-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- Contenido del perfil (solo si hay datos) -->
      <div v-else-if="user" class="profile-content">
        
        <!-- Avatar simple con inicial -->
        <div class="avatar">
          {{ getInitial(user.name) }}
        </div>

        <!-- Información del usuario -->
        <div class="user-info">
          <div class="info-item">
            <span class="label">Nombre:</span>
            <span class="value">{{ user.name }}</span>
          </div>
          
          <div class="info-item">
            <span class="label">Email:</span>
            <span class="value">{{ user.email }}</span>
          </div>
          
          <div class="info-item">
            <span class="label">ID de Usuario:</span>
            <span class="value">{{ user.sub || user.id }}</span>
          </div>
        </div>

        <!-- Botón de cerrar sesión -->
        <button @click="handleLogout" class="btn-logout">
          Cerrar Sesión
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import authService from '../services/authService'

const router = useRouter()

// Variables reactivas
const user = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')

/**
 * Obtener la inicial del nombre para el avatar
 * @param {string} name - Nombre del usuario
 * @returns {string} - Primera letra en mayúscula
 */
const getInitial = (name) => {
  return name ? name.charAt(0).toUpperCase() : '?'
}

/**
 * Cargar los datos del perfil al montar el componente
 */
const loadProfile = async () => {
  try {
    // Llamar al endpoint protegido /auth/profile
    const profileData = await authService.getProfile()
    user.value = profileData
  } catch (error) {
    errorMessage.value = 'No se pudo cargar el perfil. Por favor, inicia sesión nuevamente.'
    
    // Si hay error de autenticación, redirigir al login después de 2 segundos
    setTimeout(() => {
      authService.logout()
      router.push('/login')
    }, 2000)
  } finally {
    isLoading.value = false
  }
}

/**
 * Cerrar sesión
 */
const handleLogout = () => {
  authService.logout()
  router.push('/login')
}

/**
 * onMounted: Hook del ciclo de vida
 * Se ejecuta cuando el componente se monta en el DOM
 */
onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  padding: 20px;
}

.profile-card {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  text-align: center;
}

h1 {
  margin-bottom: 30px;
  color: #333;
}

.loading {
  color: #666;
  padding: 40px 0;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.avatar {
  /* Círculo con la inicial del usuario */
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: white;
  font-size: 36px;
  font-weight: bold;
}

.user-info {
  text-align: left;
  margin-bottom: 30px;
}

.info-item {
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  display: block;
  color: #888;
  font-size: 12px;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.value {
  color: #333;
  font-size: 16px;
}

.btn-logout {
  width: 100%;
  padding: 14px;
  background-color: #ff5722;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-logout:hover {
  background-color: #e64a19;
}
</style>
```

### 4.4 Vista de Home (Pública)

Abre `src/views/HomeView.vue` y escribe:

```vue
<!--
  Archivo: src/views/HomeView.vue
  Propósito: Página de inicio pública
  
  Esta página es accesible para todos los usuarios (autenticados o no).
  Muestra opciones de navegación según el estado de autenticación.
-->
<template>
  <div class="home-container">
    <div class="home-card">
      <h1>🚀 Bienvenido</h1>
      <p class="subtitle">Sistema de Autenticación con Vue.js y NestJS</p>

      <div class="features">
        <div class="feature">
          <span class="icon">🔐</span>
          <span>Autenticación JWT</span>
        </div>
        <div class="feature">
          <span class="icon">🛡️</span>
          <span>Rutas Protegidas</span>
        </div>
        <div class="feature">
          <span class="icon">⚡</span>
          <span>Vue 3 + Vite</span>
        </div>
      </div>

      <!-- Botones según estado de autenticación -->
      <div class="actions">
        <!-- Si NO está autenticado -->
        <template v-if="!isAuthenticated">
          <router-link to="/login" class="btn btn-primary">
            Iniciar Sesión
          </router-link>
          <router-link to="/register" class="btn btn-secondary">
            Crear Cuenta
          </router-link>
        </template>
        
        <!-- Si ESTÁ autenticado -->
        <template v-else>
          <router-link to="/profile" class="btn btn-primary">
            Ver Mi Perfil
          </router-link>
          <button @click="handleLogout" class="btn btn-secondary">
            Cerrar Sesión
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import authService from '../services/authService'

const router = useRouter()

// Propiedad computada para verificar autenticación
// Se actualiza automáticamente cuando cambia el estado
const isAuthenticated = computed(() => authService.isAuthenticated())

const handleLogout = () => {
  authService.logout()
  // Forzar recarga para actualizar el estado
  router.go(0)
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.home-card {
  background: white;
  padding: 50px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

h1 {
  font-size: 36px;
  margin-bottom: 8px;
  color: #333;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
  font-size: 16px;
}

.features {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.feature {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 14px;
  color: #555;
}

.icon {
  font-size: 18px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn {
  display: block;
  padding: 14px 24px;
  border-radius: 8px;
  font-size: 16px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-secondary:hover {
  background: #f5f5f5;
}
</style>
```

**CHECKPOINT 3:** Todas las vistas están creadas. Aún no funcionan porque falta configurar el router. ✅

---

## Parte 5: Configuración del Router

### 5.1 Crear el Router con Guards

Abre `src/router/index.js` y escribe:

```javascript
/**
 * Archivo: src/router/index.js
 * Propósito: Configurar las rutas de la aplicación y proteger las que requieren autenticación
 * 
 * Vue Router permite:
 * - Definir qué componente se muestra en cada URL
 * - Proteger rutas con Guards de navegación
 * - Redirigir usuarios según su estado de autenticación
 */

import { createRouter, createWebHistory } from 'vue-router'
import authService from '../services/authService'

// Importar las vistas
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ProfileView from '../views/ProfileView.vue'

/**
 * Definición de rutas
 * Cada ruta tiene:
 * - path: La URL
 * - name: Nombre único para referencias
 * - component: El componente Vue a mostrar
 * - meta: Información adicional (como si requiere autenticación)
 */
const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { 
      requiresGuest: true  // Solo accesible si NO está autenticado
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { 
      requiresGuest: true  // Solo accesible si NO está autenticado
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
    meta: { 
      requiresAuth: true   // Solo accesible si ESTÁ autenticado
    }
  },
  // Ruta comodín: cualquier URL no definida redirige a Home
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

// Crear la instancia del router
const router = createRouter({
  // createWebHistory: Usa URLs limpias (sin #)
  history: createWebHistory(),
  routes
})

/**
 * NAVIGATION GUARD: beforeEach
 * Se ejecuta ANTES de cada navegación
 * 
 * @param {Object} to - Ruta de destino
 * @param {Object} from - Ruta de origen
 * @param {Function} next - Función para continuar o redirigir
 */
router.beforeEach((to, from, next) => {
  // Verificar si el usuario está autenticado
  const isAuthenticated = authService.isAuthenticated()

  // Si la ruta requiere autenticación y el usuario NO está autenticado
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Redirigir al login
    next({ name: 'Login' })
    return
  }

  // Si la ruta es solo para invitados y el usuario ESTÁ autenticado
  if (to.meta.requiresGuest && isAuthenticated) {
    // Redirigir al perfil
    next({ name: 'Profile' })
    return
  }

  // En cualquier otro caso, continuar normalmente
  next()
})

export default router
```

### 5.2 Registrar el Router en la Aplicación

Abre `src/main.js` y modifícalo:

```javascript
/**
 * Archivo: src/main.js
 * Propósito: Punto de entrada de la aplicación Vue
 * 
 * Aquí se:
 * - Crea la instancia de Vue
 * - Registra plugins (como Vue Router)
 * - Monta la aplicación en el DOM
 */

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Crear la aplicación Vue
const app = createApp(App)

// Registrar el router
app.use(router)

// Montar en el elemento #app del index.html
app.mount('#app')
```

### 5.3 Actualizar App.vue

Abre `src/App.vue` y reemplaza todo su contenido:

```vue
<!--
  Archivo: src/App.vue
  Propósito: Componente raíz de la aplicación
  
  <router-view> es donde Vue Router renderiza el componente
  correspondiente a la ruta actual
-->
<template>
  <div id="app">
    <!-- Barra de navegación simple -->
    <nav class="navbar">
      <router-link to="/" class="brand">🏠 Mi App</router-link>
      
      <div class="nav-links">
        <router-link to="/">Inicio</router-link>
        
        <!-- Mostrar según estado de autenticación -->
        <template v-if="!isAuthenticated">
          <router-link to="/login">Login</router-link>
          <router-link to="/register">Registro</router-link>
        </template>
        
        <template v-else>
          <router-link to="/profile">Perfil</router-link>
          <a href="#" @click.prevent="logout">Salir</a>
        </template>
      </div>
    </nav>

    <!-- Aquí se renderizan las vistas según la ruta -->
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import authService from './services/authService'

const router = useRouter()

const isAuthenticated = computed(() => authService.isAuthenticated())

const logout = () => {
  authService.logout()
  router.push('/login')
}
</script>

<style>
/* Estilos globales */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}

/* Navbar */
.navbar {
  background: white;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.brand {
  font-size: 20px;
  font-weight: bold;
  text-decoration: none;
  color: #333;
}

.nav-links {
  display: flex;
  gap: 20px;
}

.nav-links a {
  text-decoration: none;
  color: #666;
  transition: color 0.3s;
}

.nav-links a:hover {
  color: #333;
}

.nav-links a.router-link-active {
  color: #667eea;
  font-weight: 500;
}

/* Main content */
main {
  /* El contenido principal no necesita estilos aquí */
  /* Cada vista define su propio contenedor */
}
</style>
```

**CHECKPOINT 4:** Ejecuta `npm run dev` y navega por las diferentes rutas. El login y registro aún no funcionan con el backend, pero la navegación debe funcionar. ✅

---

## Parte 6: Pruebas de Integración

### 6.1 Verificar el Backend

Antes de probar, asegúrate de que tu backend NestJS esté corriendo:

```bash
# En otra terminal, dentro del proyecto NestJS
npm run start:dev
```

### 6.2 Configurar CORS en el Backend

Si aún no lo has hecho, tu backend necesita permitir peticiones desde el frontend.

En tu `main.ts` de NestJS:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS para el frontend
  app.enableCors({
    origin: 'http://localhost:5173',  // URL del frontend (Vite)
    credentials: true,
  });
  
  await app.listen(3000);
}
bootstrap();
```

### 6.3 Flujo de Pruebas

Sigue estos pasos en orden:

1. **Probar Registro:**
   - Ve a `http://localhost:5173/register`
   - Llena el formulario con datos nuevos
   - Deberías ver mensaje de éxito y ser redirigido al login

2. **Probar Login:**
   - Ve a `http://localhost:5173/login`
   - Usa las credenciales que acabas de registrar
   - Deberías ser redirigido al perfil

3. **Verificar Perfil:**
   - Deberías ver tus datos (nombre, email)
   - El token está guardado en localStorage

4. **Probar Protección de Rutas:**
   - Intenta ir a `/login` estando autenticado (debe redirigir a perfil)
   - Cierra sesión e intenta ir a `/profile` (debe redirigir a login)

5. **Verificar Persistencia:**
   - Con sesión iniciada, recarga la página (F5)
   - Deberías seguir autenticado (el token persiste)

**CHECKPOINT 5:** Todos los flujos funcionan correctamente. ✅

---

## Parte 7: Mejoras Opcionales (Retos Adicionales)

Si terminaste antes, intenta implementar alguna de estas mejoras:

### Reto A: Validación de Formularios

Agrega validación más robusta:
- Email con formato válido
- Contraseña con requisitos (mayúscula, número, etc.)
- Mostrar indicador de fortaleza de contraseña

### Reto B: Recordar Usuario

Implementa un checkbox "Recordarme" que:
- Si está marcado, guarda el email en localStorage
- Al cargar el login, pre-llena el email guardado

### Reto C: Recuperar Contraseña

Agrega una vista de "Olvidé mi contraseña":
- Formulario que pide solo el email
- Muestra mensaje de "Si el email existe, recibirás instrucciones"
- (El backend real de esto es más complejo, pero practica la UI)

### Reto D: Tema Oscuro

Implementa un toggle de tema:
- Guarda preferencia en localStorage
- Cambia colores de la aplicación

---

## Entregables del Taller

Para completar este taller, debes entregar:

1. **Código fuente** del proyecto Vue.js completo
2. **Captura de pantalla** de cada vista funcionando:
   - Home (sin autenticación)
   - Registro
   - Login
   - Perfil (con datos del usuario)
3. **Captura de DevTools** mostrando:
   - El token guardado en localStorage
   - Una petición al endpoint /auth/profile con el header Authorization

---

## Rúbrica de Evaluación

| Criterio | Excelente (A) | Bueno (B) | Aceptable (C) | Insuficiente (D) |
|----------|---------------|-----------|---------------|------------------|
| **Estructura del proyecto** | Carpetas organizadas, nombres claros, código limpio | Estructura correcta con algunos archivos mal ubicados | Estructura básica funcional | Desorganizado o incompleto |
| **Formularios reactivos** | v-model implementado correctamente, validación completa | Formularios funcionales, validación parcial | Formularios básicos sin validación | No funcionales |
| **Integración con API** | Todas las llamadas funcionan, errores manejados | Llamadas funcionan, manejo parcial de errores | Login funciona, otros endpoints fallan | No se conecta al backend |
| **Manejo de token** | Token guardado, interceptor configurado, logout completo | Token guardado y usado correctamente | Token guardado pero sin interceptor | No maneja tokens |
| **Protección de rutas** | Guards funcionando, redirecciones correctas | Guards parciales, algunas redirecciones | Solo una ruta protegida | Sin protección de rutas |

---

## Recursos de Apoyo

- **Vue.js Docs (Español):** https://es.vuejs.org/guide/introduction.html
- **Vue Router:** https://router.vuejs.org/guide/
- **Axios:** https://axios-http.com/docs/intro
- **MDN - LocalStorage:** https://developer.mozilla.org/es/docs/Web/API/Window/localStorage

---

## Solución de Problemas Comunes

### Error: "Cannot read properties of undefined"

**Causa probable:** Intentas acceder a datos antes de que se carguen.

**Solución:** Usa `v-if` para verificar que los datos existen antes de mostrarlos.

### Error: "Network Error" o CORS

**Causa probable:** El backend no está corriendo o CORS no está configurado.

**Solución:** 
1. Verifica que el backend esté en `localhost:3000`
2. Verifica la configuración de CORS en NestJS

### El token no se envía

**Causa probable:** El interceptor no está configurado correctamente.

**Solución:** Verifica que el archivo `api.js` está importando axios y configurando el interceptor.

### La página se queda en blanco

**Causa probable:** Error de JavaScript que bloquea el renderizado.

**Solución:** Abre DevTools (F12) → Console y busca el error específico.

---

*Taller desarrollado para la asignatura Desarrollo en Plataformas - PUCE 2025*
