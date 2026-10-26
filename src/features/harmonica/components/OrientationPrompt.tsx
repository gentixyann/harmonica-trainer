"use client";

import { useEffect, useRef } from "react";

const PORTRAIT_PHONE = "(max-width: 700px) and (orientation: portrait)";

export function OrientationPrompt() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dismissedRef = useRef(false);

  useEffect(() => {
    const query = window.matchMedia(PORTRAIT_PHONE);
    const dialog = dialogRef.current;
    if (!dialog) return;

    const syncOrientation = () => {
      if (!query.matches) {
        dismissedRef.current = false;
        if (dialog.open) dialog.close();
      } else if (!dismissedRef.current && !dialog.open) {
        dialog.showModal();
      }
    };

    syncOrientation();
    query.addEventListener("change", syncOrientation);
    return () => {
      query.removeEventListener("change", syncOrientation);
      if (dialog.open) dialog.close();
    };
  }, []);

  const dismiss = () => {
    dismissedRef.current = true;
    dialogRef.current?.close();
  };

  return <dialog
    ref={dialogRef}
    className="orientation-dialog"
    aria-labelledby="orientation-dialog-title"
    aria-describedby="orientation-dialog-description"
    onCancel={() => { dismissedRef.current = true; }}
  >
    <span className="orientation-icon" aria-hidden="true">↻</span>
    <h2 id="orientation-dialog-title">スマホを横にしてください</h2>
    <p id="orientation-dialog-description">横向きにすると、落下バーと21穴のハーモニカを見やすく練習できます。画面が回らない場合は、端末の回転ロックを解除してください。</p>
    <button type="button" onClick={dismiss}>縦向きのまま続ける</button>
  </dialog>;
}
