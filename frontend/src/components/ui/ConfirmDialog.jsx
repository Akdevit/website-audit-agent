import { useEffect, useRef } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "./Button";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  isPending,
  error,
  title,
  description,
}) {
  const dialog = useRef(null);
  useEffect(() => {
    if (open && !dialog.current.open) dialog.current.showModal();
    if (!open && dialog.current.open) dialog.current.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-description"
      onClose={onClose}
      onCancel={(event) => {
        if (isPending) event.preventDefault();
      }}
      onClick={(event) => {
        if (!isPending && event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border border-line bg-white p-6 shadow-xl"
    >
      <h2
        id="confirmation-title"
        className="text-lg font-semibold tracking-tight"
      >
        {title}
      </h2>
      <p
        id="confirmation-description"
        className="mt-3 text-sm leading-6 text-muted"
      >
        {description}
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-poor">
          {error.message}
        </p>
      )}
      <div className="mt-7 flex justify-end gap-2">
        <Button
          autoFocus
          variant="secondary"
          disabled={isPending}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          disabled={isPending}
          onClick={onConfirm}
          variant="danger"
        >
          {isPending && (
            <LoaderCircle size={14} className="motion-safe:animate-spin" />
          )}
          Delete audit
        </Button>
      </div>
    </dialog>
  );
}
