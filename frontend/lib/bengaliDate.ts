// Bengali (Bangla) calendar date — Bangladesh revised calendar (Boishakh 1 = 14 April).
// Good enough for a header date strip; may be a day off around Falgun in some leap years.

const BN_MONTHS = [
  "বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন",
  "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র",
];
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export const toBengaliDigits = (value: string | number): string =>
  String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

const isGregorianLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

const dayOfYear = (a: Date, b: Date) =>
  Math.floor((Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) -
    Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) / 86400000);

export function bengaliDate(date = new Date()): string {
  const gy = date.getFullYear();
  const newYear = new Date(gy, 3, 14); // 14 April
  let bYear: number;
  let elapsed: number;
  if (date >= newYear) {
    bYear = gy - 593;
    elapsed = dayOfYear(date, newYear);
  } else {
    bYear = gy - 594;
    elapsed = dayOfYear(date, new Date(gy - 1, 3, 14));
  }
  const falgunDays = isGregorianLeap(bYear + 594) ? 30 : 29;
  const lengths = [31, 31, 31, 31, 31, 30, 30, 30, 30, 30, falgunDays, 30];
  let month = 0;
  let day = elapsed;
  while (month < 11 && day >= lengths[month]) {
    day -= lengths[month];
    month += 1;
  }
  return `${toBengaliDigits(day + 1)} ${BN_MONTHS[month]} ${toBengaliDigits(bYear)}`;
}
