# Propuesta de Actualización UX para Red Viento Sur

## Objetivo
Mejorar la experiencia de usuario (UX) y la percepción de funcionamiento de la plataforma Red Viento Sur, optimizando la interacción, el feedback visual y la accesibilidad.

## Propuesta de Mejoras

### 1. Feedback visual y validaciones en formularios
- Mensajes de éxito/error claros y visibles tras cada acción (login, registro, crear post, subir archivo, etc.).
- Deshabilitar botones y mostrar spinners durante operaciones asíncronas.
- Validar campos obligatorios antes de enviar formularios y mostrar mensajes de ayuda.

### 2. Mejoras en la subida de archivos
- Previsualización del archivo seleccionado antes de subirlo.
- Indicador de progreso de subida (barra o spinner) y opción de cancelar la subida.
- Permitir eliminar/cambiar el archivo antes de publicar.

### 3. Grabación de voz
- Temporizador y animación visual durante la grabación.
- Permitir escuchar la nota de voz antes de publicarla.
- Botón claro para cancelar o reiniciar la grabación.

### 4. Navegación y carga de datos
- Skeleton loaders o placeholders en listas de posts/eventos mientras se cargan los datos.
- Mensajes amigables cuando no hay resultados (ej: “No hay publicaciones aún”).
- Scroll automático al crear un nuevo post o evento para mostrarlo en pantalla.

### 5. Accesibilidad y usabilidad
- Mejorar el contraste de colores y el tamaño de los botones para facilitar su uso en móvil.
- Agregar etiquetas ARIA y roles en los formularios y botones importantes.
- Permitir navegación por teclado en todos los formularios y listas.

### 6. Optimización de errores y estados
- Mensajes de error específicos cuando falle la autenticación o la subida de archivos.
- Manejar desconexiones de red y mostrar un aviso si el usuario pierde conexión.
- Reintentar automáticamente la carga de datos si hay un error temporal.

### 7. Personalización y perfil
- Permitir al usuario editar su perfil y subir una foto de avatar.
- Mostrar el nombre y avatar del usuario en la barra superior y en los posts.

---

# Plan de Actualización

## Fase 1: Feedback y validaciones
- [ ] Implementar feedback visual y validaciones en todos los formularios.
- [ ] Deshabilitar botones y mostrar spinners durante operaciones asíncronas.

## Fase 2: Subida de archivos y grabación de voz
- [ ] Añadir previsualización y progreso de subida de archivos.
- [ ] Mejorar la experiencia de grabación de voz (temporizador, pre-escucha, cancelar).

## Fase 3: Navegación y carga
- [ ] Agregar skeleton loaders y mensajes amigables en listas vacías.
- [ ] Implementar scroll automático tras crear contenido.

## Fase 4: Accesibilidad y usabilidad
- [ ] Mejorar el contraste de colores, aumentar el tamaño de los botones y asegurar la navegación completa por teclado en toda la interfaz.
- [ ] Añadir etiquetas ARIA y roles apropiados en formularios, botones y elementos interactivos para mejorar la accesibilidad.

## Fase 5: Manejo de errores y estados
- [ ] Mejorar mensajes de error y manejo de desconexión.
- [ ] Implementar reintentos automáticos en carga de datos.

## Fase 6: Personalización de perfil
- [ ] Permitir edición de perfil y subida de avatar.
- [ ] Mostrar nombre y avatar en la barra superior y posts.

---

> **Nota:** Cada fase puede implementarse y desplegarse de forma incremental para obtener feedback temprano de los usuarios.
