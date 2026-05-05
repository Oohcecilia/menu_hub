import { useEffect, useRef } from "react";
import QRCodeLib from "qrcode";
import { useCart } from '@/lib/cartStore.jsx';

export default function QRCode({ order = {}, size = 200, cuid = "" }) {
  const canvasRef = useRef(null);

  const buid = order.buid || "";

  const { clearCart } = useCart();

  useEffect(() => {
    if (!canvasRef.current) return;


    const payload = {
      branch_id: buid,
      cuid: cuid || "",
      items: order?.items?.map(item => {
        const options = (item.variations || [])
          .map(v => (typeof v === "string" ? v : v?.name))
          .filter(Boolean)
          .join(", ");

        const note = item.note || "";

        return {
          id: item.product_id,
          qty: item.quantity,
          rem: `${options}${options && note ? ", " : ""}${note}`.trim()
        };
      })
    };

    const text = JSON.stringify(payload);

    QRCodeLib.toCanvas(canvasRef.current, text, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M"
    });

    clearCart();

  }, [order, size, cuid]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-xl"
    />
  );
}