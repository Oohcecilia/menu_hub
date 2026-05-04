export function buildOrderSummary(orderItems = [], productMap = {}) {
  
  let subtotal = 0;

  const prodInfo = orderItems
    // ✅ filter items that belong to active branch
    // .filter(item => {
    //   if (!activeBuid) return true; // fallback: allow all
    //   return item.buid === activeBuid;
    // })

    .map(item => {
      const product = productMap[String(item.product_id)];

      const price = product?.price || item.price || 0;
      const name = product?.name?.def || item.product_name || "Unknown item";
      const quantity = item.quantity || 0;

      const total = price * quantity;
      subtotal += total;

      return {
        product_id: item.product_id,
        name,
        price,
        quantity,
        total,
      };
    });

  return { prodInfo, subtotal };
}