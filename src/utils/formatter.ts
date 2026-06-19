export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

interface ReceiptOptions {
  discount?: number;
  tax?: number;
  paymentMethod?: string;
  amountPaid?: number;
  changeAmount?: number;
  customerName?: string;
}

export const generateWhatsAppText = (
  storeName: string,
  cartItems: { product: any; qty: number }[],
  itemNotes: Record<number, string> = {},
  itemPortions: Record<number, string> = {},
  itemFlavorLevels: Record<number, string> = {},
  options: ReceiptOptions = {}
): string => {
  const currentDate = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const customerLine = options.customerName && options.customerName.trim()
    ? `\nPelanggan : ${options.customerName}`
    : '';

  const header = `*STRUK PESANAN* 🧾\n*${storeName.toUpperCase()}*\n========================\nTanggal : ${currentDate}${customerLine}`;

  let itemsText = "";
  let subtotalAmount = 0;

  for (const item of cartItems) {
    const { product, qty } = item;
    const subtotal = product.price * qty;
    subtotalAmount += subtotal;

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

  const discount = options.discount || 0;
  const tax = options.tax || 0;
  const grandTotal = subtotalAmount - discount + tax;

  let summary = `------------------------\nSubtotal     : ${formatRupiah(subtotalAmount)}`;
  if (discount > 0) summary += `\nDiskon       : -${formatRupiah(discount)}`;
  if (tax > 0) summary += `\nPajak        : ${formatRupiah(tax)}`;
  summary += `\n*TOTAL       : ${formatRupiah(grandTotal)}*`;

  if (options.paymentMethod) {
    summary += `\nBayar (${options.paymentMethod}) : ${formatRupiah(options.amountPaid || 0)}`;
    if ((options.changeAmount || 0) > 0) {
      summary += `\nKembali      : ${formatRupiah(options.changeAmount || 0)}`;
    }
  }

  const footer = `${summary}\n========================\n_Terima kasih telah memesan!_ 🙏`;

  return `${header}\n\n${itemsText}${footer}`;
};

export const formatWhatsAppNumber = (phone: string): string => {
  // Hapus semua karakter yang bukan angka (seperti +, -, spasi)
  let numericPhone = phone.replace(/\D/g, '');

  // Jika diawali dengan angka 0, ubah menjadi 62
  if (numericPhone.startsWith('0')) {
    numericPhone = '62' + numericPhone.substring(1);
  }

  return numericPhone;
};
