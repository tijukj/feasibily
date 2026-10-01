export const TAX_DEP_RATES = {
  building_commercial: 0.10,
  building_residential: 0.05,
  plant_machinery: 0.15,
  vehicle: 0.15,
  furniture: 0.10,
  computer_software: 0.40,
  intangible: 0.25,
  land: 0,
  other: 0.15
};

export const BOOK_LIFE_YEARS = {
  building_commercial: 30,
  building_residential: 60,
  plant_machinery: 15,
  vehicle: 8,
  furniture: 10,
  computer_software: 3,
  intangible: 5,
  land: 0,
  other: 10
};

export const ASSET_CATEGORIES = [
  { key: "plant_machinery", label: "Machinery / Equipment" },
  { key: "building_commercial", label: "Building (non-residential)" },
  { key: "computer_software", label: "Computers / Software" },
  { key: "vehicle", label: "Vehicles" },
  { key: "furniture", label: "Furniture & Fittings" },
  { key: "intangible", label: "Franchise / Licence / Intangible" },
  { key: "land", label: "Land" },
  { key: "other", label: "Other assets" }
];

export const GST_SLABS = [0, 5, 18, 40];

export const TAX_PRESETS = [
  { label: "Company, concessional regime", rate: 25.17 },
  { label: "Company, normal regime, turnover up to Rs 400 Cr", rate: 26.0 },
  { label: "LLP / Firm", rate: 31.2 }
];

export const DEFAULT_THRESHOLDS = { 
  minPI: 1, 
  maxPaybackShareOfLife: 0.5 
};
