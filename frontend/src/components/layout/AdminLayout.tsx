import { Outlet } from 'react-router-dom'

// Layout placeholder para la sección administrativa
const AdminLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">Collector Admin</h1>
      </header>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout

