/**
 * Permisos disponibles en el sistema
 * Debe coincidir con el enum Permission del backend
 */
export const Permission = {
  // Formularios
  FORMS_VIEW: 'FORMS_VIEW',
  FORMS_CREATE: 'FORMS_CREATE',
  FORMS_EDIT: 'FORMS_EDIT',
  FORMS_DELETE: 'FORMS_DELETE',
  FORMS_PUBLISH: 'FORMS_PUBLISH',
  FORMS_ARCHIVE: 'FORMS_ARCHIVE',
  FORMS_VIEW_RESPONSES: 'FORMS_VIEW_RESPONSES',

  // Usuarios
  USERS_VIEW: 'USERS_VIEW',
  USERS_CREATE: 'USERS_CREATE',
  USERS_EDIT: 'USERS_EDIT',
  USERS_DELETE: 'USERS_DELETE',
  USERS_CHANGE_ROLE: 'USERS_CHANGE_ROLE',
  USERS_DEACTIVATE: 'USERS_DEACTIVATE',

  // Asignaciones
  ASSIGNMENTS_VIEW: 'ASSIGNMENTS_VIEW',
  ASSIGNMENTS_CREATE: 'ASSIGNMENTS_CREATE',
  ASSIGNMENTS_EDIT: 'ASSIGNMENTS_EDIT',
  ASSIGNMENTS_DELETE: 'ASSIGNMENTS_DELETE',

  // Reportes
  REPORTS_VIEW: 'REPORTS_VIEW',
  REPORTS_EXPORT: 'REPORTS_EXPORT',

  // EPP Monitor
  EPP_MONITOR_VIEW: 'EPP_MONITOR_VIEW',
  EPP_MONITOR_MANAGE: 'EPP_MONITOR_MANAGE',

  // Structure Monitor (Avance de obra)
  STRUCTURE_MONITOR_VIEW: 'STRUCTURE_MONITOR_VIEW',
  STRUCTURE_MONITOR_MANAGE: 'STRUCTURE_MONITOR_MANAGE',

  // Panel de administración
  ACCESS_ADMIN_PANEL: 'ACCESS_ADMIN_PANEL',
  ACCESS_MOBILE_APP: 'ACCESS_MOBILE_APP',
  ACCESS_SETTINGS: 'ACCESS_SETTINGS',

  // Gestión de permisos y roles
  ROLES_VIEW: 'ROLES_VIEW',
  ROLES_CREATE: 'ROLES_CREATE',
  ROLES_EDIT: 'ROLES_EDIT',
  ROLES_DELETE: 'ROLES_DELETE',
  PERMISSIONS_MANAGE: 'PERMISSIONS_MANAGE',

  // Bodega - Solicitudes
  WAREHOUSE_REQUEST_MATERIALS: 'WAREHOUSE_REQUEST_MATERIALS',
  WAREHOUSE_AUTHORIZE_REQUESTS: 'WAREHOUSE_AUTHORIZE_REQUESTS',
  WAREHOUSE_SCAN_QR: 'WAREHOUSE_SCAN_QR',
  WAREHOUSE_MANAGE_STOCK: 'WAREHOUSE_MANAGE_STOCK',
  WAREHOUSE_VIEW_STOCK: 'WAREHOUSE_VIEW_STOCK',
} as const

export type Permission = (typeof Permission)[keyof typeof Permission]

/**
 * Agrupa permisos por módulo para facilitar la gestión
 */
export const PermissionGroups: Record<string, Permission[]> = {
  FORMS: [
    Permission.FORMS_VIEW,
    Permission.FORMS_CREATE,
    Permission.FORMS_EDIT,
    Permission.FORMS_DELETE,
    Permission.FORMS_PUBLISH,
    Permission.FORMS_ARCHIVE,
    Permission.FORMS_VIEW_RESPONSES,
  ],
  USERS: [
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_EDIT,
    Permission.USERS_DELETE,
    Permission.USERS_CHANGE_ROLE,
    Permission.USERS_DEACTIVATE,
  ],
  ASSIGNMENTS: [
    Permission.ASSIGNMENTS_VIEW,
    Permission.ASSIGNMENTS_CREATE,
    Permission.ASSIGNMENTS_EDIT,
    Permission.ASSIGNMENTS_DELETE,
  ],
  REPORTS: [Permission.REPORTS_VIEW, Permission.REPORTS_EXPORT],
  EPP_MONITOR: [Permission.EPP_MONITOR_VIEW, Permission.EPP_MONITOR_MANAGE],
  STRUCTURE_MONITOR: [
    Permission.STRUCTURE_MONITOR_VIEW,
    Permission.STRUCTURE_MONITOR_MANAGE,
  ],
  ACCESS: [
    Permission.ACCESS_ADMIN_PANEL,
    Permission.ACCESS_MOBILE_APP,
    Permission.ACCESS_SETTINGS,
  ],
  ROLES: [
    Permission.ROLES_VIEW,
    Permission.ROLES_CREATE,
    Permission.ROLES_EDIT,
    Permission.ROLES_DELETE,
    Permission.PERMISSIONS_MANAGE,
  ],
  WAREHOUSE: [
    Permission.WAREHOUSE_REQUEST_MATERIALS,
    Permission.WAREHOUSE_AUTHORIZE_REQUESTS,
    Permission.WAREHOUSE_SCAN_QR,
    Permission.WAREHOUSE_MANAGE_STOCK,
    Permission.WAREHOUSE_VIEW_STOCK,
  ],
}

/**
 * Labels descriptivos para cada permiso
 */
export const PermissionLabels: Record<Permission, string> = {
  [Permission.FORMS_VIEW]: 'Ver formularios',
  [Permission.FORMS_CREATE]: 'Crear formularios',
  [Permission.FORMS_EDIT]: 'Editar formularios',
  [Permission.FORMS_DELETE]: 'Eliminar formularios',
  [Permission.FORMS_PUBLISH]: 'Publicar formularios',
  [Permission.FORMS_ARCHIVE]: 'Archivar formularios',
  [Permission.FORMS_VIEW_RESPONSES]: 'Ver respuestas de formularios',

  [Permission.USERS_VIEW]: 'Ver usuarios',
  [Permission.USERS_CREATE]: 'Crear usuarios',
  [Permission.USERS_EDIT]: 'Editar usuarios',
  [Permission.USERS_DELETE]: 'Eliminar usuarios',
  [Permission.USERS_CHANGE_ROLE]: 'Cambiar rol de usuarios',
  [Permission.USERS_DEACTIVATE]: 'Desactivar usuarios',

  [Permission.ASSIGNMENTS_VIEW]: 'Ver asignaciones',
  [Permission.ASSIGNMENTS_CREATE]: 'Crear asignaciones',
  [Permission.ASSIGNMENTS_EDIT]: 'Editar asignaciones',
  [Permission.ASSIGNMENTS_DELETE]: 'Eliminar asignaciones',

  [Permission.REPORTS_VIEW]: 'Ver reportes',
  [Permission.REPORTS_EXPORT]: 'Exportar reportes',

  [Permission.EPP_MONITOR_VIEW]: 'Ver monitoreo EPP',
  [Permission.EPP_MONITOR_MANAGE]: 'Gestionar monitoreo EPP',

  [Permission.STRUCTURE_MONITOR_VIEW]: 'Ver avance de obra',
  [Permission.STRUCTURE_MONITOR_MANAGE]: 'Gestionar avance de obra',

  [Permission.ACCESS_ADMIN_PANEL]: 'Acceso al panel administrativo',
  [Permission.ACCESS_MOBILE_APP]: 'Acceso a la aplicación móvil',
  [Permission.ACCESS_SETTINGS]: 'Acceso a configuración',

  [Permission.ROLES_VIEW]: 'Ver roles',
  [Permission.ROLES_CREATE]: 'Crear roles',
  [Permission.ROLES_EDIT]: 'Editar roles',
  [Permission.ROLES_DELETE]: 'Eliminar roles',
  [Permission.PERMISSIONS_MANAGE]: 'Gestionar permisos',

  [Permission.WAREHOUSE_REQUEST_MATERIALS]: 'Solicitar materiales de bodega',
  [Permission.WAREHOUSE_AUTHORIZE_REQUESTS]: 'Autorizar solicitudes de materiales',
  [Permission.WAREHOUSE_SCAN_QR]: 'Escanear QR de entrega',
  [Permission.WAREHOUSE_MANAGE_STOCK]: 'Gestionar stock de bodega',
  [Permission.WAREHOUSE_VIEW_STOCK]: 'Ver stock de bodega',
}

