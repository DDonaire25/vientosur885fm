# Depuración de mensajería

Archivos eliminados por no ser necesarios para el nuevo modal/rediseño de mensajería:

- ConversationsList.mobile.css (solo estilos móviles, no relevante para modal de escritorio)
- ChatWindow.e2e.spec.ts (test E2E antiguo, no aporta al nuevo modal)
- MessagesPage.tsx y MessagesPage.test.tsx (no forman parte del flujo actual de mensajería)
- DirectMessagesPage.tsx (no se usa en el modal/rediseño)

Estos archivos pueden restaurarse desde control de versiones si se requieren en el futuro.
