import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { FileText, Calendar, Loader2, AlertCircle } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { useFormAssignments } from '@/shared/hooks/useFormAssignments'
import { type FormAssignmentWithDetails } from '@/shared/hooks/useFormAssignments'

/**
 * Componente que muestra las asignaciones pendientes del usuario actual
 */
const PendingAssignments = () => {
  const navigate = useNavigate()
  const { assignments, loading, fetchAssignments } = useFormAssignments()
  const [pendingAssignments, setPendingAssignments] = useState<FormAssignmentWithDetails[]>([])

  useEffect(() => {
    void fetchAssignments()
  }, [fetchAssignments])

  useEffect(() => {
    const now = new Date()
    const pending = assignments.filter((assignment) => {
      // Filtrar solo asignaciones activas y no completadas
      const startDate = new Date(assignment.startDate)
      const endDate = assignment.endDate ? new Date(assignment.endDate) : null

      return (
        !assignment.isCompleted &&
        startDate <= now &&
        (endDate === null || endDate >= now)
      )
    })
    setPendingAssignments(pending)
  }, [assignments])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Formularios Asignados</CardTitle>
          <CardDescription>Formularios pendientes de completar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (pendingAssignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Formularios Asignados</CardTitle>
          <CardDescription>Formularios pendientes de completar</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No tienes formularios pendientes en este momento.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Formularios Asignados</CardTitle>
        <CardDescription>
          {pendingAssignments.length} formulario(s) pendiente(s) de completar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{assignment.formTitle || 'Formulario sin título'}</h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(new Date(assignment.startDate), 'dd/MM/yyyy')}
                      {assignment.endDate && ` - ${format(new Date(assignment.endDate), 'dd/MM/yyyy')}`}
                    </span>
                  </div>
                  <Badge variant="outline">{assignment.frequency}</Badge>
                </div>
              </div>
              <Button
                onClick={() => navigate(`/form/${assignment.id}`)}
                className="ml-4"
              >
                Responder
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default PendingAssignments

