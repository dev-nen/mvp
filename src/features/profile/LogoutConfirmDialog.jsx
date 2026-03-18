import { Button } from "@/components/ui/button";
import "./LogoutConfirmDialog.css";

export function LogoutConfirmDialog({ open, onCancel, onConfirm }) {
  if (!open) {
    return null;
  }

  return (
    <div className="logout-confirm-dialog" role="presentation">
      <div className="logout-confirm-dialog__overlay" onClick={onCancel} />

      <div
        className="logout-confirm-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
      >
        <p className="logout-confirm-dialog__eyebrow">Cerrar sesion</p>
        <h2 id="logout-confirm-title" className="logout-confirm-dialog__title">
          Quieres salir ahora?
        </h2>
        <p className="logout-confirm-dialog__description">
          Vas a volver a la Home publica. Despues podras conectar el logout real
          de autenticacion sin cambiar este flujo.
        </p>

        <div className="logout-confirm-dialog__actions">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirm}>
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}
