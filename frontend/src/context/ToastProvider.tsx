import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ToastContext } from "./toastContext";

const TOAST_DURATION_MS = 3000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("Operación completada con éxito.");
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  const hide = useCallback(() => {
    window.clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  const show = useCallback((text: string) => {
    window.clearTimeout(timeoutRef.current);
    setMessage(text);
    setVisible(true);
    timeoutRef.current = window.setTimeout(
      () => setVisible(false),
      TOAST_DURATION_MS,
    );
  }, []);

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="alert"
        aria-live="polite"
        className={`fixed top-5 right-5 z-50 flex items-center space-x-3 rounded-xl border border-kleta-pink/30 bg-white p-4 text-gray-700 shadow-lg transition-transform duration-300 ease-out ${
          visible ? "translate-x-0" : "translate-x-[calc(100%+1.25rem)]"
        }`}
      >
        <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-kleta-blush text-kleta-rose">
          <i className="fa-solid fa-check" />
        </div>
        <div className="pr-2 text-sm font-medium">{message}</div>
        <button
          type="button"
          onClick={hide}
          aria-label="Cerrar notificación"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg p-1.5 text-gray-400 hover:text-gray-900"
        >
          <i className="fa-solid fa-xmark text-lg" />
        </button>
      </div>
    </ToastContext.Provider>
  );
}
