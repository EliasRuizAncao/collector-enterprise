import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

// Landing Pages
import Landing from '@/pages/Landing'
import About from '@/pages/About'
import Contact from '@/pages/Contact'
import Login from '@/pages/Login'

// Admin Pages
import Dashboard from '@/pages/admin/Dashboard'
import Forms from '@/pages/admin/Forms'
import FormBuilder from '@/pages/admin/FormBuilder'
import Users from '@/pages/admin/Users'

// Layouts
import LandingLayout from '@/components/layout/LandingLayout'
import AdminLayout from '@/components/layout/AdminLayout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Routes */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/nosotros" element={<About />} />
          <Route path="/contacto" element={<Contact />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/formularios" element={<Forms />} />
          <Route path="/admin/formularios/nuevo" element={<FormBuilder />} />
          <Route path="/admin/formularios/:id" element={<FormBuilder />} />
          <Route path="/admin/usuarios" element={<Users />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App