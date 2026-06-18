export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

export const generateWhatsAppText = (
  storeName: string,
  cartItems: { product: any; qty: number }[],
  itemNotes: Record<number, string> = {},
  itemPortions: Record<number, string> = {},
  itemFlavorLevels: Record<number, string> = {}
): string => {
  const currentDate = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const header = `*STRUK PESANAN* 🧾\n*${storeName.toUpperCase()}*\n========================\nTanggal : ${currentDate}`;

  let itemsText = "";
  let totalAmount = 0;

  for (const item of cartItems) {
    const { product, qty } = item;
    const subtotal = product.price * qty;
    totalAmount += subtotal;

    itemsText += `*${product.name}*\n`;
    
    const portion = itemPortions[product.id] || 'Normal';
    const flavorLevel = itemFlavorLevels[product.id] || 'Normal';
    const isAsin = product.flavorType === 'Asin';
    const flavorTypeStr = isAsin ? 'Pedas' : 'Manis';

    itemsText += ` - Porsi: ${portion}\n`;
    itemsText += ` - ${flavorTypeStr}: ${flavorLevel}\n`;

    const notes = itemNotes[product.id];
    if (notes && notes.trim() !== "") {
      itemsText += ` _(Catatan: ${notes})_\n`;
    }
    
    itemsText += `${qty} x ${formatRupiah(product.price)} = *${formatRupiah(subtotal)}*\n\n`;
  }

  const footer = `------------------------\n*TOTAL       : ${formatRupiah(totalAmount)}*\n========================\n_Terima kasih telah memesan!_ 🙏`;

  return `${header}\n\n${itemsText}${footer}`;
};
