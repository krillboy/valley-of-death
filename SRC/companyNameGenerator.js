// Company name generator for biotech companies

const biotechPrefixes = ["Bio", "Gene", "Smart", "Gen", "Chimera", "RNA", "Neuro", "Medico", "Thera", "Cell", "CAR", "Nano", "Pharma", "Immuno", "Neuro", "Vita", "Sci", "Onco"];
const biotechSuffixes = ["Gen", "Genics", "Genix", "Net", "AI", "Tech", "Group", "Labs", "Medica", "Vax", "Accelera", "Junction", "Solutions", "Systema", "Systems", "Hub", "Onyx", "Core", "Ome", "Omic"];
const biotechSuffix2 = ["Ltd", "Inc", "GmbH", "Australia", "", "", "", "", "", "", "", "", "Incorporated", "Industries", "LLP", "Foundation"];

export function generateCompanyName() {
  const prefix = biotechPrefixes[Math.floor(Math.random() * biotechPrefixes.length)];
  const suffix = biotechSuffixes[Math.floor(Math.random() * biotechSuffixes.length)];
  const suffix2 = biotechSuffix2[Math.floor(Math.random() * biotechSuffix2.length)];
  const base = `${prefix}${suffix}`;
  return suffix2 ? `${base} ${suffix2}` : base;
}
