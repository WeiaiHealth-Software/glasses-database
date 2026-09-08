export function formatDate(date: Date | string | number, fmt = 'YYYY-MM-DD HH:mm'): string {
  const d = new Date(date);
  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    MM: String(d.getMonth() + 1).padStart(2, '0'),
    DD: String(d.getDate()).padStart(2, '0'),
    HH: String(d.getHours()).padStart(2, '0'),
    mm: String(d.getMinutes()).padStart(2, '0'),
    ss: String(d.getSeconds()).padStart(2, '0'),
  };
  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => map[match] ?? match);
}

export function formatCurrency(value: number | undefined | null, symbol = '¥'): string {
  if (value == null || Number.isNaN(value)) return '-';
  return `${symbol}${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
