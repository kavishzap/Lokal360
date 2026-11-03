export function phoneKey(phone: string) {
  return phone.trim().replace(/[\s().-]/g, "").toLowerCase();
}

export function phoneDigits(phone: string) {
  return phoneKey(phone).replace(/\D/g, "");
}
