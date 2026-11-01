import type { CompanyProfile } from "@/types";

export function defaultCompany(): CompanyProfile {
  return {
    name: "B42 Bistro",
    legalName: "B42 Bistro Ltd",
    brn: "C18123456",
    vatNumber: "VAT20345678",
    tan: "12345678",
    address: "Royal Road",
    city: "Grand Baie",
    phone: "+230 263 4200",
    email: "hello@b42bistro.mu",
    website: "https://b42bistro.mu",
    logo: null,
  };
}

export function companyInitials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
  return letters || "B42";
}
