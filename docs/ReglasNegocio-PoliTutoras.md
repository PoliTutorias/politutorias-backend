> Redactado por: Anthony Morales  
> Fecha: 24 de febrero de 2026  
> Proyecto: PoliTutorías - Escuela Politécnica Nacional

---

| ID | Definición de la regla | Tipo de regla | Estática o dinámica | Fuente |
| :--- | :--- | :--- | :--- | :--- |
| **USER-01** | Un mismo usuario puede tener simultáneamente el rol de Estudiante y el rol de Tutor. | Hecho | Estática | Política de Perfiles de Usuario |
| **SOL-01** | Un estudiante solo puede solicitar tutorías dentro de la **ventana activa**: de lunes 00:00 a domingo 19:59, la ventana es la semana en curso; a partir del domingo 20:00 y hasta domingo 23:59, la ventana cambia automáticamente a la semana siguiente. Nunca coexisten dos ventanas. | Restricción | Dinámica | Política de Agenda |
| **SOL-02** | El sistema requiere una anticipación mínima de 4 horas exactas (diferencia entre la hora actual y el inicio del horario disponible) para permitir el envío de una nueva solicitud. Los horarios con menos de 4 horas de anticipación se muestran deshabilitados en el calendario. | Restricción | Dinámica | Política de Solicitudes |
| **SOL-03** | Si la diferencia de tiempo entre la hora actual y la hora de inicio de la disponibilidad del tutor es menor a 4 horas y la solicitud sigue en estado "Pendiente", el sistema la cambiará automáticamente a "Expirada" mediante un proceso automatizado que se ejecuta cada 5 minutos. | Activador de la acción | Dinámica | Política de Solicitudes |
| **SOL-04** | Una solicitud de tutoría solo puede contener un bloque de tiempo disponible del tutor (una hora por solicitud). | Hecho | Estática | Política de Solicitudes |
| **SOL-05** | El estudiante puede mantener activa (en estado "Pendiente" o "Aceptada") únicamente una solicitud para un día y hora específicos, evitando superposiciones en su propio horario. | Restricción | Estática | Política de Solicitudes |
| **SOL-06** | El estudiante puede mantener múltiples solicitudes activas hacia un mismo tutor (para la misma o diferentes ofertas), siempre y cuando correspondan a bloques horarios distintos. | Hecho | Estática | Política de Solicitudes |
| **SOL-07** | El sistema bloqueará la opción de cancelar tutorías en estado "Aceptada" cuando la diferencia entre la hora actual y la hora acordada sea menor a 2 horas. | Restricción | Estática | Política de Solicitudes |
| **SOL-08** | Un estudiante puede cancelar libremente su propia solicitud en cualquier momento mientras esta se mantenga en estado "Pendiente". | Hecho | Estática | Política de Solicitudes |
| **CAL-01** | Los bloques horarios que ya no cumplen la anticipación mínima de 4 horas (SOL-02) se muestran deshabilitados y tachados en el calendario, evitando que el usuario seleccione horarios inválidos. | Restricción | Dinámica | Lógica de Calendario |
| **CAL-02** | El domingo a las 20:00, la ventana activa de solicitudes se desplaza automáticamente a la semana siguiente. Todos los slots de la semana actual dejan de ser seleccionables y el calendario muestra la semana próxima (lunes–domingo). | Activador de la acción | Dinámica | Lógica de Calendario |
| **FAC-01** | Cada tutor está asociado a una única facultad al registrarse. | Hecho | Estática | Modelo de Datos |
| **OFERTA-01** | Si el tutor lo configura, el sistema debe bloquear la recepción de solicitudes para un horario con 24 horas de anticipación a su inicio, sobrescribiendo la regla base (SOL-02). | Activador de la acción | Dinámica | Política de Publicación de Oferta |

> **Nota de cambio (2026-03-23):**  
> - **SOL-01** revisada: se introduce el concepto de **ventana activa** para eliminar la ambigüedad de "semana en curso" en el borde del domingo a las 20:00. Las antiguas CAL-02 y CAL-03 se fusionaron en la nueva **CAL-02**.  
> - **SOL-02** ampliada: el bloqueo de 12 horas ahora se aplica a nivel de slot individual (no solo de día).  
> - **SOL-03** ampliada: se precisa que la transición PENDIENTE → EXPIRADA ocurre mediante un cron job automático cada 5 minutos.  
> - Se elimina la antigua **CAL-03** (fusionada en CAL-02).

---
Última actualización: 23 de marzo de 2026  
<br>Responsable: Anthony Morales