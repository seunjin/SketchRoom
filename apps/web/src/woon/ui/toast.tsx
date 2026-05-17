import { X } from "lucide-react";
import type { ToastDefaultRenderProps } from "@woon-ui/toast";
import "./toast.css";

export type ToastProps = ToastDefaultRenderProps;

export function Toast({ action, close, description, title }: ToastProps) {
  return (
    <>
      <div data-woon-toast-body>
        <span data-woon-toast-title>{title}</span>
        {description && (
          <span data-woon-toast-description>{description}</span>
        )}
      </div>
      <div data-woon-toast-actions>
        {action && (
          <button data-woon-toast-action onClick={action.onClick} type="button">
            {action.label}
          </button>
        )}
        <button
          aria-label="닫기"
          data-woon-toast-close
          onClick={close}
          type="button"
        >
          <X aria-hidden="true" className="size-3.5" />
        </button>
      </div>
    </>
  );
}
