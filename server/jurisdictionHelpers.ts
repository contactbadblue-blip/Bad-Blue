// Jurisdiction Helper Functions
// Utilities for formatting department names and determining agency types

/**
 * Format department name based on location and agency type
 * @param city - City name
 * @param state - State code (e.g., "CA", "NY")
 * @param agencyType - Type of agency: 'police', 'sheriff', or 'trooper'
 * @returns Properly formatted department name
 */
export function formatDepartmentName(
  city: string,
  state: string,
  agencyType: 'police' | 'sheriff' | 'trooper'
): string {
  const cityName = city.trim();
  const stateName = getStateName(state);
  
  switch (agencyType) {
    case 'police':
      return `${cityName} Police Department`;
    case 'sheriff':
      return `${cityName} Sheriffs Department`;
    case 'trooper':
      return `${stateName} State Troopers`;
    default:
      return `${cityName} Police Department`;
  }
}

/**
 * Determine agency type based on context or officer title
 * @param department - Department name or description
 * @returns Determined agency type
 */
export function determineAgencyType(department?: string): 'police' | 'sheriff' | 'trooper' {
  if (!department) return 'police';
  
  const lowerDept = department.toLowerCase();
  
  if (lowerDept.includes('sheriff')) {
    return 'sheriff';
  }
  
  if (lowerDept.includes('trooper') || lowerDept.includes('state patrol') || lowerDept.includes('highway patrol')) {
    return 'trooper';
  }
  
  return 'police';
}

/**
 * Get full state name from state code
 */
function getStateName(stateCode: string): string {
  const stateMap: Record<string, string> = {
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming',
    'DC': 'District of Columbia',
  };
  
  return stateMap[stateCode.toUpperCase()] || stateCode;
}
