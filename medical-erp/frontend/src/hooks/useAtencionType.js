import { useState, useEffect, useMemo } from 'react';

// ============================================
// Hook: Auto-detect attention type from patient context
// Logic:
//   No historia + no tratamientos → primera_consulta
//   Has active treatment (EN_CURSO) → continuar_tratamiento
//   Has finished treatment (FINALIZADO) + cita hoy → control
//   Has historia but no active treatment → seguimiento
// ============================================

export function useAtencionType({ historia, tratamientos, citasHoy }) {
  const [manualOverride, setManualOverride] = useState(null);

  const detectedType = useMemo(() => {
    const hasHistoria = !!historia;
    const hasActiveTreatment = tratamientos?.some(
      (t) => t.estado === 'EN_CURSO' || t.estado === 'PROGRAMADO'
    );
    const hasFinishedTreatment = tratamientos?.some(
      (t) => t.estado === 'FINALIZADO'
    );
    const hasCitaHoy = citasHoy?.length > 0;

    if (!hasHistoria) return 'primera_consulta';
    if (hasActiveTreatment) return 'continuar_tratamiento';
    if (hasFinishedTreatment && hasCitaHoy) return 'control';
    return 'seguimiento';
  }, [historia, tratamientos, citasHoy]);

  const attentionType = manualOverride || detectedType;

  const resetToDetected = () => setManualOverride(null);

  return {
    detectedType,
    attentionType,
    setAttentionType: setManualOverride,
    resetToDetected,
  };
}
