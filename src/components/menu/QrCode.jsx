import { useEffect, useMemo, useRef } from "react";
import { QRCode } from "react-qrcode-logo";
import { useCart } from '@/lib/cartStore.jsx';
import { useBranch } from '@/lib/BranchContext';
import { qrEncode } from '@/utils/qrcode';


export default function QRCodeComponent({ order = {}, size = 200, cuid = "" }) {
  const { activeBranch } = useBranch();
  const { clearCart } = useCart();

  const buid = order?.buid || "";
  const noImage = activeBranch?.no_image || null;

  // 🔒 prevent duplicate cart clearing (fix loop risk)
  const hasClearedRef = useRef(false);

  // ✅ stable items reference
  const items = order?.items || [];

  const payload = useMemo(() => {
    return {
      branch_id: buid,
      cuid: cuid || "",
      items: items.map((item) => {
        const options = (item.variations || [])
          .map((v) => (typeof v === "string" ? v : v?.name))
          .filter(Boolean)
          .join(", ");

        const note = item.note || "";

        return {
          id: item.product_id,
          qty: item.quantity,
          rem: `${options}${options && note ? ", " : ""}${note}`.trim(),
        };
      }),
    };
  }, [items, buid, cuid]);

  return (
    <>
      <QRCode
        value={qrEncode(JSON.stringify(payload))}
        size={size}
        ecLevel="H"
        quietZone={10}
        logoImage={noImage}
        logoWidth={size * 0.25}
        logoHeight={size * 0.25}
        removeQrCodeBehindLogo={true}
        qrStyle="dots"
        eyeRadius={8}
        fgColor="#000000"
        bgColor="#ffffff"
      />
    </>
    
  );
}