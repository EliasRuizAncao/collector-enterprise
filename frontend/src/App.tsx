import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'

import ProtectedRoute from '@/shared/components/auth/ProtectedRoute'
import RoleProtectedRoute from '@/shared/components/common/RoleProtectedRoute'
import RouteSkeleton from '@/shared/components/common/RouteSkeleton'
import UpdatePrompt from '@/mobile/components/UpdatePrompt'

// Landing Pages (cargadas inmediatamente, no lazy)
import Landing from '@/landing/pages/Landing'
import About from '@/landing/pages/About'
import Contact from '@/landing/pages/Contact'
import Login from '@/landing/pages/Login'
import CollectorLanding from '@/landing/pages/CollectorLanding'
import CollectorAbout from '@/landing/pages/CollectorAbout'
import CollectorContact from '@/landing/pages/CollectorContact'
import LandingLayout from '@/landing/components/LandingLayout'
import CollectorLandingLayout from '@/landing/components/CollectorLandingLayout'

// Admin Layout y Pages (lazy loading)
const AdminLayout = lazy(() => import('@/admin/components/AdminLayout'))
const AdminDashboard = lazy(() => import('@/admin/pages/Dashboard'))
const AdminForms = lazy(() => import('@/admin/pages/Forms'))
const AdminFormBuilder = lazy(() => import('@/admin/pages/FormBuilder'))
const AdminUsers = lazy(() => import('@/admin/pages/Users'))
const AdminFormResponse = lazy(() => import('@/admin/pages/FormResponse'))
const AdminFormResponses = lazy(() => import('@/admin/pages/FormResponses'))
const AdminFormAssignments = lazy(() => import('@/admin/pages/FormAssignments'))

// Mobile Layout y Pages (lazy loading)
const MobileLayout = lazy(() => import('@/mobile/layouts/MobileLayout'))
const MobileDashboard = lazy(() => import('@/mobile/pages/Dashboard'))
const MobileAssignments = lazy(() => import('@/mobile/pages/Assignments'))
const MobileCamera = lazy(() => import('@/mobile/pages/Camera'))
const MobileFormResponse = lazy(() => import('@/mobile/pages/FormResponse'))
const MobileProfile = lazy(() => import('@/mobile/pages/Profile'))
const MobileSettings = lazy(() => import('@/mobile/pages/Settings'))
const MobileSecurity = lazy(() => import('@/mobile/pages/Security'))
const MobileSessions = lazy(() => import('@/mobile/pages/Sessions'))
const MobileDeleteAccount = lazy(() => import('@/mobile/pages/DeleteAccount'))
const TutorialLibrary = lazy(() => import('@/mobile/pages/TutorialLibrary'))
const MobileHistory = lazy(() => import('@/mobile/pages/History'))
const MobileNotifications = lazy(() => import('@/mobile/pages/Notifications'))
const MobileFAQ = lazy(() => import('@/mobile/pages/FAQ'))
const MobileSupport = lazy(() => import('@/mobile/pages/Support'))
const MobileReport = lazy(() => import('@/mobile/pages/Report'))
const ReportsDashboard = lazy(() => import('@/mobile/pages/ReportsDashboard'))
const PersonalReports = lazy(() => import('@/mobile/pages/PersonalReports'))

/**
 * Componente para prefetch de rutas críticas
 * Pre-carga módulos cuando el usuario está cerca de navegar a ellos
 */
const RoutePrefetcher = () => {
  const location = useLocation()

  useEffect(() => {
    // Prefetch de rutas críticas basado en la ruta actual
    const prefetchRoutes = () => {
      // Si está en login, prefetch según el rol (lo haremos después del login)
      if (location.pathname === '/login') {
        // Prefetch ambos layouts para reducir tiempo de carga post-login
        import('@/admin/components/AdminLayout')
        import('@/mobile/layouts/MobileLayout')
      }

      // Si está en admin dashboard, prefetch páginas comunes
      if (location.pathname.startsWith('/admin')) {
        import('@/admin/pages/Forms')
        import('@/admin/pages/Users')
      }

      // Si está en mobile dashboard, prefetch asignaciones
      if (location.pathname.startsWith('/mobile')) {
        import('@/mobile/pages/Assignments')
        import('@/mobile/pages/Profile')
      }
    }

    // Prefetch después de un pequeño delay para no interferir con la carga actual
    const timeoutId = setTimeout(prefetchRoutes, 1000)

    return () => clearTimeout(timeoutId)
  }, [location.pathname])

  return null
}

/**
 * Componente wrapper para incluir RoutePrefetcher dentro del router
 */
const AppRoutes = () => {
  return (
    <>
      <RoutePrefetcher />
      <Routes>
        {/* Landing Routes - Sin lazy loading (carga inmediata) */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/nosotros" element={<About />} />
          <Route path="/contacto" element={<Contact />} />
        </Route>

        {/* Collector Landing */}
        <Route element={<CollectorLandingLayout />}>
          <Route path="/collector" element={<CollectorLanding />} />
          <Route path="/collector/nosotros" element={<CollectorAbout />} />
          <Route path="/collector/contacto" element={<CollectorContact />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />

        {/* Admin Routes - Lazy loading con Suspense */}
        <Route
          element={
            <ProtectedRoute>
              <Suspense fallback={<RouteSkeleton variant="default" />}>
              <AdminLayout />
              </Suspense>
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route
            path="/admin/dashboard"
            element={
              <Suspense fallback={<RouteSkeleton variant="default" />}>
                <AdminDashboard />
              </Suspense>
            }
          />
          <Route
            path="/admin/formularios"
            element={
              <Suspense fallback={<RouteSkeleton variant="default" />}>
                <AdminForms />
              </Suspense>
            }
          />
          <Route
            path="/admin/formularios/nuevo"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                <Suspense fallback={<RouteSkeleton variant="default" />}>
                  <AdminFormBuilder />
                </Suspense>
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/formularios/:id"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                <Suspense fallback={<RouteSkeleton variant="default" />}>
                  <AdminFormBuilder />
                </Suspense>
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/formularios/:formId/respuestas"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                <Suspense fallback={<RouteSkeleton variant="default" />}>
                  <AdminFormResponses />
                </Suspense>
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/asignaciones"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                <Suspense fallback={<RouteSkeleton variant="default" />}>
                  <AdminFormAssignments />
                </Suspense>
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                <Suspense fallback={<RouteSkeleton variant="default" />}>
                  <AdminUsers />
                </Suspense>
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/form/:assignmentId"
            element={
              <Suspense fallback={<RouteSkeleton variant="default" />}>
                <AdminFormResponse />
              </Suspense>
            }
          />
        </Route>

        {/* Mobile Routes - Lazy loading con Suspense */}
        <Route
          element={
            <ProtectedRoute>
              <Suspense fallback={<RouteSkeleton variant="mobile" />}>
                <MobileLayout />
              </Suspense>
            </ProtectedRoute>
          }
        >
          <Route path="/mobile" element={<Navigate to="/mobile/dashboard" replace />} />
          <Route
            path="/mobile/dashboard"
            element={
              <Suspense fallback={<RouteSkeleton variant="mobile" />}>
                <MobileDashboard />
              </Suspense>
            }
          />
          <Route
            path="/mobile/assignments"
            element={
              <Suspense fallback={<RouteSkeleton variant="mobile" />}>
                <MobileAssignments />
              </Suspense>
            }
          />
          <Route
            path="/mobile/form/:assignmentId"
            element={
              <Suspense fallback={<RouteSkeleton variant="mobile" />}>
                <MobileFormResponse />
              </Suspense>
            }
          />
          <Route
            path="/mobile/camera"
            element={
              <Suspense fallback={<RouteSkeleton variant="mobile" />}>
                <MobileCamera />
              </Suspense>
            }
          />
          <Route
            path="/mobile/profile"
            element={
              <Suspense fallback={<RouteSkeleton variant="mobile" />}>
                <MobileProfile />
              </Suspense>
            }
          />
          <Route
            path="/mobile/settings"
            element={
              <Suspense fallback={<RouteSkeleton variant="mobile" />}>
                <MobileSettings />
              </Suspense>
            }
          />
          <Route
            path="/mobile/settings/security"
            element={
              <Suspense fallback={<RouteSkeleton variant="mobile" />}>
                <MobileSecurity />
              </Suspense>
            }
          />
          <Route
            path="/mobile/settings/sessions"
            element={
              <Suspense fallback={<RouteSkeleton variant="mobile" />}>
                <MobileSessions />
              </Suspense>
            }
          />
          <Route
            path="/mobile/settings/delete-account"
            element={
              <Suspense fallback={<RouteSkeleton variant="mobile" />}>
                <MobileDeleteAccount />
              </Suspense>
            }
          />
          <Route
            path="/mobile/tutorials"
            element={
              <Suspense fallback={<RouteSkeleton variant="mobile" />}>
                <TutorialLibrary />
              </Suspense>
            }
          />
          <Route
            path="/mobile/history"
            element={
              <Suspense fallback={<RouteSkeleton variant="mobile" />}>
                <MobileHistory />
              </Suspense>
            }
          />
          <Route
            path="/mobile/notifications"
            element={
              <Suspense fallback={<RouteSkeleton variant="mobile" />}>
                <MobileNotifications />
              </Suspense>
            }
          />
          <Route
            path="/mobile/faq"
            element={
              <Suspense fallback={<RouteSkeleton variant="mobile" />}>
                <MobileFAQ />
              </Suspense>
            }
          />
          <Route
            path="/mobile/support"
            element={
              <Suspense fallback={<RouteSkeleton variant="mobile" />}>
                <MobileSupport />
              </Suspense>
            }
          />
          <Route
            path="/mobile/report"
            element={
              <Suspense fallback={<RouteSkeleton variant="mobile" />}>
                <MobileReport />
              </Suspense>
            }
          />
          <Route
            path="/mobile/reports"
            element={
              <Suspense fallback={<RouteSkeleton variant="mobile" />}>
                <ReportsDashboard />
              </Suspense>
            }
          />
          <Route
            path="/mobile/reports/personal"
            element={
              <Suspense fallback={<RouteSkeleton variant="mobile" />}>
                <PersonalReports />
              </Suspense>
            }
          />
        </Route>

        {/* 404 - Redirigir según rol si está autenticado */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Navigate to="/" replace />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

function App() {
  return (
    <>
      <UpdatePrompt autoShow={true} />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </>
  )
}

export default App