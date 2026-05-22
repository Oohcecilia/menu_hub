type QRType = "order" | "reservation" | "table";

interface QRItem {
  id: number | string;
  qty?: number | string;
  variation?: number | string;
  addon?: number | string | Array<number | string>;
  removable?: number | string | Array<number | string>;
}

interface QRPayload {
  type?: QRType;
  branch_id: number | string;
  cuid?: number | string;
  items?: QRItem[];
}

export function qrEncode(json: string): string {
  let data: QRPayload;

  try {
    data = JSON.parse(json);
  } catch {
    return "";
  }

  if (!data || typeof data !== "object") {
    return "";
  }

  // TYPE
  const typeMap: Record<string, string> = {
    order: "O",
    reservation: "R",
    table: "T",
  };

  const type = (data.type || "order").toLowerCase();

  let out = typeMap[type] || "O";

  // branch_id HEX
  out += Number(data.branch_id)
    .toString(16)
    .toUpperCase();

  // G = cuid HEX
  if (data.cuid) {
    out +=
      "G" +
      Number(data.cuid)
        .toString(16)
        .toUpperCase();
  }

  // items
  for (const item of data.items || []) {
    // P = product HEX
    out +=
      "P" +
      Number(item.id)
        .toString(16)
        .toUpperCase();

    // Q = qty only if > 1
    if (item.qty && Number(item.qty) > 1) {
      out += "Q" + Number(item.qty);
    }

    // V = variation HEX
    if (item.variation) {
      out +=
        "V" +
        Number(item.variation)
          .toString(16)
          .toUpperCase();
    }

    // X = addon HEX
    if (item.addon) {
      const addons = Array.isArray(item.addon)
        ? item.addon
        : [item.addon];

      for (const addon of addons) {
        out +=
          "X" +
          Number(addon)
            .toString(16)
            .toUpperCase();
      }
    }

    // R = removable HEX
    if (item.removable) {
      const removables = Array.isArray(item.removable)
        ? item.removable
        : [item.removable];

      for (const removable of removables) {
        out +=
          "R" +
          Number(removable)
            .toString(16)
            .toUpperCase();
      }
    }
  }

  return out;
}
