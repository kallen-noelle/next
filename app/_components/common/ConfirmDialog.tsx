"use client";

import { useState, useRef, useCallback } from "react";
import Dialog from "./Dialog";

export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const resolveRef = useRef<(ok: boolean) => void>(() => {});

  const confirm = useCallback((msg: string): Promise<boolean> => {
    setMessage(msg);
    setOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleClose = (ok: boolean) => {
    setOpen(false);
    resolveRef.current(ok);
  };

  const ConfirmDialog = (
    <Dialog open={open} onClose={() => handleClose(false)} title="Confirm">
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={() => handleClose(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
        <button onClick={() => handleClose(true)} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors">Delete</button>
      </div>
    </Dialog>
  );

  return { confirm, ConfirmDialog };
}
