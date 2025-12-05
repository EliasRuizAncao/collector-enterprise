import { useEffect, useRef } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/shared/lib/firebase'
import { useAuthStore } from '@/shared/store/authStore'
import { authService } from '@/shared/services/authService'

/**
 * Componente que inicializa la autenticación cuando la app se carga
 * Verifica si hay un token persistido y carga los permisos del usuario
 */
const AuthInitializer = () => {
  const { setAuth, setPermissions, logout, setLoadingPermissions } = useAuthStore()
  const hasInitialized = useRef(false)
  const loadingPermissionsRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      // Solo inicializar una vez
      if (hasInitialized.current) return
      hasInitialized.current = true

      try {
        // Escuchar cambios en el estado de autenticación de Firebase
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (!isMounted) return

          if (firebaseUser) {
            try {
              // Si hay un usuario en Firebase, obtener el token y cargar datos del backend
              const idToken = await firebaseUser.getIdToken()
              
              // Si ya tenemos usuario y token en el store, solo actualizar permisos si faltan
              const currentState = useAuthStore.getState()
              if (currentState.user && currentState.token && !currentState.permissions && !loadingPermissionsRef.current) {
                loadingPermissionsRef.current = true
                setLoadingPermissions(true)
                try {
                  const currentUserData = await authService.getCurrentUser()
                  if (currentUserData.permissions && Array.isArray(currentUserData.permissions) && currentUserData.permissions.length > 0) {
                    setPermissions(currentUserData.permissions)
                    console.log('[AuthInitializer] Permisos cargados:', currentUserData.permissions.length)
                  }
                } catch (error) {
                  console.error('[AuthInitializer] Error al cargar permisos:', error)
                } finally {
                  loadingPermissionsRef.current = false
                  setLoadingPermissions(false)
                }
              } else if (!currentState.user || !currentState.token) {
                // Si no hay usuario en el store, cargar desde el backend
                try {
                  const currentUserData = await authService.getCurrentUser()
                  if (currentUserData) {
                    setAuth(
                      {
                        id: currentUserData.id,
                        email: currentUserData.email,
                        name: currentUserData.name,
                        role: currentUserData.role,
                        roleId: currentUserData.roleId,
                        firebaseUid: currentUserData.firebaseUid,
                      },
                      idToken,
                      currentUserData.permissions,
                    )
                  }
                } catch (error) {
                  console.error('Error al cargar usuario:', error)
                  // Si falla, hacer logout
                  if (isMounted) {
                    logout()
                  }
                }
              }
            } catch (error) {
              console.error('Error al inicializar auth:', error)
              if (isMounted) {
                logout()
              }
            }
          } else {
            // No hay usuario en Firebase, limpiar el store
            const currentState = useAuthStore.getState()
            if (isMounted && currentState.user) {
              logout()
            }
          }
        })

        // Si ya hay un token pero no hay permisos, intentar cargarlos inmediatamente
        // Esperar un momento para que el store se hidrate desde localStorage
        setTimeout(async () => {
          const currentState = useAuthStore.getState()
          console.log('[AuthInitializer] Verificando permisos después de hidratación:', {
            hasToken: !!currentState.token,
            hasUser: !!currentState.user,
            hasPermissions: !!(currentState.permissions && currentState.permissions.length > 0),
            permissionsCount: currentState.permissions?.length || 0,
          })
          
          if (currentState.token && currentState.user && !currentState.permissions && !loadingPermissionsRef.current) {
            loadingPermissionsRef.current = true
            setLoadingPermissions(true)
            try {
              console.log('[AuthInitializer] Cargando permisos iniciales desde localStorage...')
              const currentUserData = await authService.getCurrentUser()
              if (currentUserData.permissions && Array.isArray(currentUserData.permissions) && currentUserData.permissions.length > 0) {
                setPermissions(currentUserData.permissions)
                console.log('[AuthInitializer] Permisos iniciales cargados:', currentUserData.permissions.length)
                
                // Verificar que se guardaron correctamente
                setTimeout(() => {
                  const verifyState = useAuthStore.getState()
                  console.log('[AuthInitializer] Verificación después de cargar permisos:', {
                    permissionsCount: verifyState.permissions?.length || 0,
                    permissions: verifyState.permissions?.slice(0, 5),
                  })
                }, 100)
              }
            } catch (error) {
              console.error('[AuthInitializer] Error al cargar permisos iniciales:', error)
            } finally {
              loadingPermissionsRef.current = false
              setLoadingPermissions(false)
            }
          } else if (currentState.permissions && currentState.permissions.length > 0) {
            console.log('[AuthInitializer] Permisos ya disponibles desde localStorage:', currentState.permissions.length)
          }
        }, 500) // Aumentar a 500ms para dar más tiempo a la hidratación

        return () => {
          unsubscribe()
          isMounted = false
        }
      } catch (error) {
        console.error('Error en initializeAuth:', error)
      }
    }

    void initializeAuth()
  }, [setAuth, setPermissions, logout, setLoadingPermissions])

  // No renderizar nada, solo inicializar
  return null
}

export default AuthInitializer

