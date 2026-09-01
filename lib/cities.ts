export const indianCities = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Surat",
  "Lucknow",
  "Kochi",
  "Chandigarh",
  "Indore",
  "Goa",
] as const;

export type IndianCity = (typeof indianCities)[number];
