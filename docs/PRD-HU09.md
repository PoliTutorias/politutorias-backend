PRD — HU09-Ver solicitudes recibidas
Versión: 1.0 | Estado: En definición | Fecha: 24 de mayo de 2024

Metadatos
Campo	Valor
Historia de Usuario	HU09
Título	Ver solicitudes recibidas
Tipo de cambio	feat
HU relacionada	HU08 (Creación de solicitud por estudiante)
Rama	feat/ver-solicitudes-recibidas
Observación clave	Los botones "Aceptar" y "Rechazar" deben renderizarse en la UI pero su lógica de backend/click no forma parte de esta HU.
1. Resumen Ejecutivo
Esta funcionalidad permite a los tutores gestionar la demanda de sus servicios a través de una bandeja de entrada centralizada. El objetivo es proporcionar una interfaz clara donde el tutor pueda identificar rápidamente quiénes son los estudiantes interesados, qué materias requieren y bajo qué condiciones económicas y de modalidad se solicita el servicio.

El sistema organiza las solicitudes por estados para evitar la saturación visual, permitiendo al tutor enfocarse en las solicitudes pendientes de respuesta mientras mantiene un histórico de aquellas que han expirado por falta de acción o tiempo.

2. Contexto y Problema
2.1 Contexto del negocio
Actualmente, los tutores no tienen una forma estructurada de visualizar las peticiones de los estudiantes que han visto sus ofertas. La bandeja de entrada de solicitudes es el punto de entrada principal para el flujo de conversión de un prospecto (estudiante) a una sesión de tutoría confirmada.

2.2 Problema a resolver
Falta de visibilidad de nuevas solicitudes de tutoría.
Dificultad para distinguir entre solicitudes vigentes y aquellas que ya no son válidas (expiradas).
Incapacidad de ver el mensaje completo del estudiante sin navegar fuera de la lista principal.
Desconocimiento del volumen total de trabajo pendiente (conteos globales).
3. Objetivos
3.1 Objetivo principal
Implementar una bandeja de entrada para el tutor que permita listar, filtrar y detallar las solicitudes de tutoría recibidas.

3.2 Objetivos específicos
Visualizar el conteo en tiempo real de solicitudes en estados Pendiente, Expirada y Respondida.
Listar solicitudes de forma paginada para optimizar el rendimiento.
Permitir la expansión de filas para consultar información detallada (modalidad, precio y mensaje completo).
Diferenciar visualmente entre estados mediante pestañas de navegación.
4. Alcance
4.1 Incluido en esta HU
Backend: Endpoints para conteo (/counts) y listado filtrado (/) con paginación.
Frontend: Interfaz de bandeja de entrada con pestañas.
UI Dinámica: Lógica de expansión/colapso de filas en la tabla de solicitudes.
Formatos: Transformación de fechas (DD Mon YYYY) y truncado de mensajes para la vista resumen.
4.2 Fuera del alcance
Elemento / Sección	Motivo de exclusión
Lógica de Aceptar/Rechazar	Se implementará en una HU posterior de gestión de estados.
Pestaña "Respondidas"	Se excluye para priorizar la visualización de flujo pendiente/expirado.
Notificaciones Push/Email	No solicitado en los requerimientos actuales de visualización.
5. Historia de Usuario
Como tutor,
quiero ver las solicitudes de tutoría que he recibido,
para enterarme de los estudiantes que necesitan mi ayuda y evaluar sus propuestas.

6. Criterios de Aceptación
Escenario 1: Visualización inicial de solicitudes pendientes
Dado que	El tutor ha iniciado sesión y navega a la sección de "Bandeja".
Cuando	La página carga los datos iniciales.
Entonces	Se deben mostrar los conteos globales en las pestañas y la lista de solicitudes con estado "PENDIENTE" por defecto.
Escenario 2: Cambio entre estados (Pestañas)
Dado que	El tutor está en la pestaña "Pendientes".
Cuando	Hace clic en la pestaña "Expiradas".
Entonces	El sistema debe realizar una nueva petición al backend filtrando por status=EXPIRADA y actualizar la tabla con los nuevos resultados.
Escenario 3: Expansión de detalles de solicitud
Dado que	El tutor visualiza una fila de solicitud en la tabla.
Cuando	Hace clic sobre la fila colapsada.
Entonces	La fila se expande mostrando: Modalidad (Virtual/Presencial), Precio por Hora, Mensaje Completo y los botones de acción (solo lectura para esta HU).
Escenario 4: Manejo de bandeja vacía
Dado que	El tutor no tiene solicitudes en un estado específico.
Cuando	Accede a dicha pestaña.
Entonces	Se debe ocultar la cabecera de la tabla y mostrar el mensaje: "No hay solicitudes [estado]."
7. Contrato de Datos (API)
Endpoints
GET /api/solicitudes/counts
GET /api/solicitudes?status={status}&page={n}&limit={m}
Campos utilizados por esta HU

{
  "id": "uuid",
  "estudiante": "Nombre del Estudiante",
  "materia": "Nombre de la materia",
  "fechaHora": "25 May 2024 10:30", // Formateado en Backend
  "mensajeResumen": "Primeros 50 caracteres...", 
  "estado": "PENDIENTE | EXPIRADA",
  "modalidad": "Virtual | Presencial",
  "precioHora": 15.50,
  "mensajeCompleto": "Texto íntegro enviado por el estudiante"
}
8. Arquitectura de Componentes
Estructura Frontend (Next.js)

BandejaEntradaPage (Server Component)
├── NavBar
├── GlobalPendingCount (Client Component - Badge)
└── TabsComponent (Client Component)
    └── SolicitudesTable
        ├── NoRequestsMessage (Condicional)
        └── SolicitudRow (Expandible/Colapsable)
            ├── AcceptButton (Render únicamente)
            └── RejectButton (Render únicamente)
Flujo de datos
Server Action: fetchInitialDataAction obtiene conteos y primera página de pendientes.
Client Component: TabsComponent maneja el estado de la pestaña activa.
Server Action: getSolicitudesAction se dispara al cambiar de pestaña o página.
9. Casos de Error
Situación	Comportamiento esperado
Token JWT expirado	Redirección automática al Login (manejado por JwtAuthGuard).
Usuario sin rol de Tutor	Error 403 Forbidden con mensaje "Solo los tutores pueden acceder...".
Error de conexión a DB	El frontend debe mostrar un estado de error o mantener la lista vacía con un mensaje de "Error al cargar datos".
10. Pruebas
10.1 Funcionales (E2E)
ID	Descripción	Resultado esperado
T-01	Carga de bandeja con datos	Los contadores coinciden con el total de filas devueltas por el API.
T-02	Paginación	Al cambiar a página 2, se traen registros diferentes y el offset es correcto.
T-03	Expansión de fila	Al expandir, el ícono de flecha cambia de dirección y se visualiza el mensajeCompleto.
10.2 Unitarias
Componente / Clase	Caso de prueba
SolicitudesService	Validar que getFiltered devuelva exactamente los campos del DTO.
SolicitudesController	Validar que el ValidationPipe rechace estados de solicitud inexistentes.
FilterParamsDto	Verificar que los valores por defecto sean page=1 y limit=10.
11. Notas al Revisor
Paginación: El límite por defecto es 10 registros.
Formateo de Fecha: Se realiza en el SolicitudesService usando toLocaleDateString para asegurar consistencia entre lo que el servidor entrega y lo que el cliente ve.
Truncado de Mensaje: El mensajeResumen se genera en el backend (primeros 50 caracteres) para reducir el payload inicial si los mensajes son muy extensos.
UI/UX: El diseño contempla que los botones de acción solo aparezcan en solicitudes con estado PENDIENTE y cuando la fila esté expandida. Para EXPIRADA, los botones no deben mostrarse.