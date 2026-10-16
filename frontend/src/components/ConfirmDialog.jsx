import { Dialog } from './Dialog.jsx';

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onClose }) {
  return (
    <Dialog title={title} onClose={onClose} className="confirm-dialog">
      <p className="confirm-message">{message}</p>
      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="button button-danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
