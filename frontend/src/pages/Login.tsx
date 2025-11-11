import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import logo from '@/assets/collector-mark.svg'

// Esquema de validación para el formulario de inicio de sesión
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  remember: z.boolean().optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

// Página de login solamente con UI. La integración con Firebase se hará más adelante.
const Login = () => {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  })

  const onSubmit = async (_values: LoginFormValues) => {
    setError(null)
    setIsSubmitting(true)
    try {
      // Placeholder de autenticación: se reemplazará con Firebase
      await new Promise((resolve) => setTimeout(resolve, 1200))
      setError('Credenciales inválidas. Verifica tu email y contraseña.')
    } catch (err) {
      setError('Ocurrió un error inesperado. Intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35)_0,_transparent_55%)]" />
      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="border border-slate-800 bg-slate-900/85 shadow-2xl shadow-slate-900/50 backdrop-blur">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800">
              <img src={logo} alt="Collector Enterprise" className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold text-white">Iniciar Sesión</CardTitle>
              <CardDescription className="text-slate-400">
                Accede al panel administrativo de Collector Enterprise.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error de autenticación</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="tu.email@empresa.cl"
                          autoComplete="email"
                          className="border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-primary focus-visible:ring-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-primary focus-visible:ring-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="remember"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start gap-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-slate-600 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                      <div className="grid gap-1 leading-tight">
                        <FormLabel className="text-sm font-medium text-slate-200">
                          Recordarme
                        </FormLabel>
                        <p className="text-xs text-slate-500">
                          Mantén tu sesión activa en este dispositivo.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Autenticando...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button variant="link" className="px-0 text-sm text-slate-400 hover:text-primary" asChild>
              <Link to="#">¿Olvidaste tu contraseña?</Link>
            </Button>
            <p className="text-xs text-slate-500">
              Para acceder necesitas un usuario registrado por el administrador de Collector Enterprise.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default Login

