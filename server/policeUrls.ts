// Police Department URLs organized by city for prioritized searching
// URLs extracted from user-provided department directory

export interface PoliceDepartmentUrl {
  city: string;
  state: string;
  url: string;
  department?: string;
}

// Comprehensive police department URL database
export const POLICE_DEPARTMENT_URLS: PoliceDepartmentUrl[] = [
  // Iowa
  { city: "Des Moines", state: "IA", url: "https://www.dsm.city/departments/police-division/index.php", department: "Des Moines Police Division" },
  { city: "Cedar Rapids", state: "IA", url: "https://www.cedar-rapids.org/local_government/departments_g_-_v/police/index.php", department: "Cedar Rapids Police Department" },
  { city: "Iowa City", state: "IA", url: "https://www.icgov.org/government/departments-and-divisions/police-department", department: "Iowa City Police Department" },
  { city: "West Des Moines", state: "IA", url: "https://www.wdm.iowa.gov/government/police", department: "West Des Moines Police Department" },
  { city: "Cedar Falls", state: "IA", url: "https://www.cedarfalls.com/Directory.aspx?did=16", department: "Cedar Falls Police Department" },
  { city: "Marion", state: "IA", url: "https://www.cityofmarion.org/government/police-department", department: "Marion Police Department" },
  { city: "North Liberty", state: "IA", url: "https://northlibertyiowa.org/departments/police/", department: "North Liberty Police Department" },
  { city: "Ankeny", state: "IA", url: "https://www.ankenyiowa.gov/542/Police-Department", department: "Ankeny Police Department" },
  { city: "Urbandale", state: "IA", url: "https://www.urbandale.org/directory.aspx?did=21", department: "Urbandale Police Department" },
  { city: "Coralville", state: "IA", url: "https://www.coralville.org/77/Police", department: "Coralville Police Department" },
  { city: "Johnston", state: "IA", url: "https://www.cityofjohnston.com/159/Police-Department", department: "Johnston Police Department" },
  { city: "Marshalltown", state: "IA", url: "https://marshalltown-ia.gov/446/Police-Department", department: "Marshalltown Police Department" },
  { city: "Sioux City", state: "IA", url: "https://www.siouxcitypolice.com", department: "Sioux City Police Department" },
  { city: "Davenport", state: "IA", url: "https://davenportiowa.com/government/departments/police", department: "Davenport Police Department" },
  { city: "Waterloo", state: "IA", url: "https://www.waterloopolice.com", department: "Waterloo Police Department" },
  { city: "Council Bluffs", state: "IA", url: "https://www.councilbluffs-ia.gov/319/Police-Department", department: "Council Bluffs Police Department" },
  { city: "Ames", state: "IA", url: "https://www.cityofames.org/my-government/departments/police-department", department: "Ames Police Department" },
  { city: "Bettendorf", state: "IA", url: "https://www.bettendorf.org/departments/police/index.php", department: "Bettendorf Police Department" },
  { city: "Mason City", state: "IA", url: "https://www.masoncitypd.us", department: "Mason City Police Department" },
  { city: "Clinton", state: "IA", url: "https://www.cityofclintoniowa.gov/230/Police-Department", department: "Clinton Police Department" },
  { city: "Burlington", state: "IA", url: "https://www.burlingtoniowa.org/2158/Police", department: "Burlington Police Department" },
  { city: "Muscatine", state: "IA", url: "https://muscatineiowa.gov/17/Police-Department", department: "Muscatine Police Department" },
  { city: "Fort Dodge", state: "IA", url: "https://www.fortdodgeiowa.org/police", department: "Fort Dodge Police Department" },
  { city: "Ottumwa", state: "IA", url: "https://www.ottumwa.us/departments/police", department: "Ottumwa Police Department" },
  { city: "Newton", state: "IA", url: "https://www.newtongov.org/92/Police", department: "Newton Police Department" },
  { city: "Altoona", state: "IA", url: "https://www.altoona-iowa.com/departments/public_safety/police", department: "Altoona Police Department" },
  { city: "Boone", state: "IA", url: "https://www.boonegov.com/department/index.php?structureid=22", department: "Boone Police Department" },
  { city: "Waukee", state: "IA", url: "https://www.waukee.org/263/Police", department: "Waukee Police Department" },
  { city: "Pella", state: "IA", url: "https://www.cityofpella.com/pellaPD", department: "Pella Police Department" },
  { city: "Indianola", state: "IA", url: "https://www.indianolaiowa.gov/149/Police-Department", department: "Indianola Police Department" },
  { city: "Oskaloosa", state: "IA", url: "https://www.oskaloosaiowa.org/94/Police", department: "Oskaloosa Police Department" },
  { city: "Keokuk", state: "IA", url: "https://cityofkeokuk.org/government/police", department: "Keokuk Police Department" },
  { city: "Spencer", state: "IA", url: "https://spenceriowacity.com/departments/public-safety/police-department", department: "Spencer Police Department" },
  { city: "Storm Lake", state: "IA", url: "https://www.stormlake.org/173/Police-Department", department: "Storm Lake Police Department" },
  { city: "Le Mars", state: "IA", url: "https://www.lemarsiowa.com/321/Police-Department", department: "Le Mars Police Department" },
  { city: "Sioux Center", state: "IA", url: "https://www.siouxcenter.org/112/Police", department: "Sioux Center Police Department" },
  { city: "Grinnell", state: "IA", url: "https://www.grinnelliowa.gov/169/Police", department: "Grinnell Police Department" },
  { city: "Decorah", state: "IA", url: "https://www.decorahia.org/departments/police-department", department: "Decorah Police Department" },
  { city: "Carroll", state: "IA", url: "https://www.cityofcarroll.com/carroll-government/police-department", department: "Carroll Police Department" },
  { city: "Atlantic", state: "IA", url: "https://atlanticiowapd.org/", department: "Atlantic Police Department" },
  { city: "Independence", state: "IA", url: "https://www.independenceia.gov/164/Police-Department", department: "Independence Police Department" },
  { city: "Algona", state: "IA", url: "https://www.algonaiowa.gov/12623/Police", department: "Algona Police Department" },

  // Major US Cities
  { city: "New York", state: "NY", url: "https://www.nyc.gov/site/nypd/index.page", department: "New York Police Department" },
  { city: "Los Angeles", state: "CA", url: "https://www.lapdonline.org", department: "Los Angeles Police Department" },
  { city: "Chicago", state: "IL", url: "https://home.chicagopolice.org", department: "Chicago Police Department" },
  { city: "Houston", state: "TX", url: "https://www.houstontx.gov/police/", department: "Houston Police Department" },
  { city: "Phoenix", state: "AZ", url: "https://www.phoenix.gov/police", department: "Phoenix Police Department" },
  { city: "Philadelphia", state: "PA", url: "https://www.phila.gov/departments/philadelphia-police-department/", department: "Philadelphia Police Department" },
  { city: "San Antonio", state: "TX", url: "https://www.sanantonio.gov/sapd", department: "San Antonio Police Department" },
  { city: "San Diego", state: "CA", url: "https://www.sandiego.gov/police", department: "San Diego Police Department" },
  { city: "Dallas", state: "TX", url: "https://www.dallaspolice.net", department: "Dallas Police Department" },
  { city: "San Jose", state: "CA", url: "https://www.sjpd.org", department: "San Jose Police Department" },
  { city: "Austin", state: "TX", url: "https://www.austintexas.gov/department/police", department: "Austin Police Department" },
  { city: "Jacksonville", state: "FL", url: "https://www.jaxsheriff.org", department: "Jacksonville Sheriff's Office" },
  { city: "Fort Worth", state: "TX", url: "https://www.fortworthpd.com", department: "Fort Worth Police Department" },
  { city: "Columbus", state: "OH", url: "https://www.columbus.gov/police", department: "Columbus Division of Police" },
  { city: "San Francisco", state: "CA", url: "https://www.sanfranciscopolice.org", department: "San Francisco Police Department" },
  { city: "Charlotte", state: "NC", url: "https://charlottenc.gov/CMPD", department: "Charlotte-Mecklenburg Police Department" },
  { city: "Indianapolis", state: "IN", url: "https://www.indy.gov/agency/indianapolis-metropolitan-police-department", department: "Indianapolis Metropolitan Police Department" },
  { city: "Seattle", state: "WA", url: "https://www.seattle.gov/police", department: "Seattle Police Department" },
  { city: "Denver", state: "CO", url: "https://www.denvergov.org/Government/Departments/Police-Department", department: "Denver Police Department" },
  { city: "Washington", state: "DC", url: "https://mpdc.dc.gov", department: "Metropolitan Police Department of the District of Columbia" },
  { city: "Boston", state: "MA", url: "https://www.boston.gov/departments/police", department: "Boston Police Department" },
  { city: "El Paso", state: "TX", url: "https://www.elpasotexas.gov/police-department", department: "El Paso Police Department" },
  { city: "Nashville", state: "TN", url: "https://www.nashville.gov/departments/police", department: "Nashville Metropolitan Police Department" },
  { city: "Detroit", state: "MI", url: "https://detroitmi.gov/departments/police-department", department: "Detroit Police Department" },
  { city: "Oklahoma City", state: "OK", url: "https://www.okc.gov/departments/police", department: "Oklahoma City Police Department" },
  { city: "Portland", state: "OR", url: "https://www.portland.gov/police", department: "Portland Police Bureau" },
  { city: "Las Vegas", state: "NV", url: "https://www.lvmpd.com", department: "Las Vegas Metropolitan Police Department" },
  { city: "Baltimore", state: "MD", url: "https://www.baltimorepolice.org/", department: "Baltimore Police Department" },
  { city: "Louisville", state: "KY", url: "https://louisville-police.org", department: "Louisville Metro Police Department" },
  { city: "Milwaukee", state: "WI", url: "https://www.milwaukee.gov/police", department: "Milwaukee Police Department" },
  { city: "Albuquerque", state: "NM", url: "https://www.cabq.gov/police", department: "Albuquerque Police Department" },
  { city: "Tucson", state: "AZ", url: "https://www.tucsonaz.gov/police", department: "Tucson Police Department" },
  { city: "Fresno", state: "CA", url: "https://www.fresno.gov/departments/police", department: "Fresno Police Department" },
  { city: "Sacramento", state: "CA", url: "https://www.cityofsacramento.org/Police", department: "Sacramento Police Department" },
  { city: "Kansas City", state: "MO", url: "https://www.kcpd.org", department: "Kansas City Police Department" },
  { city: "Mesa", state: "AZ", url: "https://www.mesaaz.gov/government/police-department", department: "Mesa Police Department" },
  { city: "Atlanta", state: "GA", url: "https://www.atlantapd.org/", department: "Atlanta Police Department" },
  { city: "Colorado Springs", state: "CO", url: "https://coloradosprings.gov/police", department: "Colorado Springs Police Department" },
  { city: "Raleigh", state: "NC", url: "https://www.raleighnc.gov/government/content/Police-Department", department: "Raleigh Police Department" },
  { city: "Miami", state: "FL", url: "https://www.miami-police.org", department: "Miami Police Department" },
  { city: "Long Beach", state: "CA", url: "https://www.longbeach.gov/pd", department: "Long Beach Police Department" },
  { city: "Virginia Beach", state: "VA", url: "https://www.vbgov.com/government/departments/police", department: "Virginia Beach Police Department" },
  { city: "Omaha", state: "NE", url: "https://police.cityofomaha.org/", department: "Omaha Police Department" },
  { city: "Oakland", state: "CA", url: "https://www.oaklandca.gov/departments/oakland-police-department", department: "Oakland Police Department" },
  { city: "Minneapolis", state: "MN", url: "https://www.minneapolis.gov/police", department: "Minneapolis Police Department" },
  { city: "Tulsa", state: "OK", url: "https://www.cityoftulsa.org/government/departments/police", department: "Tulsa Police Department" },
  { city: "Arlington", state: "TX", url: "https://www.arlingtontx.gov/city_hall/departments/police", department: "Arlington Police Department" },
  { city: "New Orleans", state: "LA", url: "https://www.nola.gov/departments/police", department: "New Orleans Police Department" },
  { city: "Wichita", state: "KS", url: "https://www.wichita.gov/Government/Departments/Police", department: "Wichita Police Department" },
  { city: "Cleveland", state: "OH", url: "https://www.clevelandohio.gov/police", department: "Cleveland Division of Police" },
  { city: "Tampa", state: "FL", url: "https://www.tampagov.net/departments/police-administrative-division", department: "Tampa Police Department" },
  { city: "Bakersfield", state: "CA", url: "https://www.bakersfieldcity.us/gov/departments/police", department: "Bakersfield Police Department" },
  { city: "Aurora", state: "CO", url: "https://www.auroragov.org/departments/police", department: "Aurora Police Department" },
  { city: "Honolulu", state: "HI", url: "https://www.honolulu.gov/police", department: "Honolulu Police Department" },
  { city: "Anaheim", state: "CA", url: "https://www.anaheim.net/280/Police-Department", department: "Anaheim Police Department" },
  { city: "Santa Ana", state: "CA", url: "https://www.santa-ana.org/police", department: "Santa Ana Police Department" },
  { city: "Corpus Christi", state: "TX", url: "https://www.cctexas.com/departments/police-department", department: "Corpus Christi Police Department" },
  { city: "Riverside", state: "CA", url: "https://www.riversideca.gov/rpd", department: "Riverside Police Department" },
  { city: "St. Louis", state: "MO", url: "https://www.slmpd.org", department: "St. Louis Metropolitan Police Department" },
  { city: "Lexington", state: "KY", url: "https://www.lexingtonky.gov/departments/police", department: "Lexington Police Department" },
  { city: "Stockton", state: "CA", url: "https://www.stocktonca.gov/government/departments/police-department", department: "Stockton Police Department" },
  { city: "Pittsburgh", state: "PA", url: "https://pittsburghpa.gov/police", department: "Pittsburgh Bureau of Police" },
  { city: "St. Paul", state: "MN", url: "https://www.stpaul.gov/departments/police", department: "St. Paul Police Department" },
  { city: "Cincinnati", state: "OH", url: "https://www.cincinnati-oh.gov/police", department: "Cincinnati Police Department" },
  { city: "Anchorage", state: "AK", url: "https://www.muni.org/departments/police", department: "Anchorage Police Department" },
  { city: "Henderson", state: "NV", url: "https://www.cityofhenderson.com/government/departments/police", department: "Henderson Police Department" },
  { city: "Greensboro", state: "NC", url: "https://www.greensboro-nc.gov/departments/police", department: "Greensboro Police Department" },
  { city: "Plano", state: "TX", url: "https://www.plano.gov/281/Police", department: "Plano Police Department" },
  { city: "Newark", state: "NJ", url: "https://npd.newarkpublicsafety.org", department: "Newark Police Department" },
  { city: "Lincoln", state: "NE", url: "https://www.lincoln.ne.gov/City/Departments/Police", department: "Lincoln Police Department" },
  { city: "Toledo", state: "OH", url: "https://toledo.oh.gov/services/public-safety/police-operations", department: "Toledo Police Department" },
  { city: "Orlando", state: "FL", url: "https://www.orlando.gov/Our-Government/Departments-Offices/Police-Department", department: "Orlando Police Department" },
  { city: "Chula Vista", state: "CA", url: "https://www.chulavistaca.gov/departments/police-department", department: "Chula Vista Police Department" },
  { city: "Fort Wayne", state: "IN", url: "https://www.cityoffortwayne.org/police", department: "Fort Wayne Police Department" },
  { city: "Jersey City", state: "NJ", url: "https://jerseycitynj.gov/cityhall/publicsafety/police", department: "Jersey City Police Department" },
  { city: "St. Petersburg", state: "FL", url: "https://www.stpete.org/police", department: "St. Petersburg Police Department" },
  { city: "Buffalo", state: "NY", url: "https://www.buffalony.gov/307/Police-Department", department: "Buffalo Police Department" },
  { city: "Chandler", state: "AZ", url: "https://www.chandleraz.gov/government/departments/police", department: "Chandler Police Department" },
  { city: "Laredo", state: "TX", url: "https://www.cityoflaredo.com/police/", department: "Laredo Police Department" },
  { city: "Durham", state: "NC", url: "https://www.durhampolicenc.com/", department: "Durham Police Department" },
  { city: "Lubbock", state: "TX", url: "https://ci.lubbock.tx.us/departments/police", department: "Lubbock Police Department" },
  { city: "Madison", state: "WI", url: "https://www.cityofmadison.com/police", department: "Madison Police Department" },
  { city: "Reno", state: "NV", url: "https://www.reno.gov/government/departments/police-department", department: "Reno Police Department" },
  { city: "Glendale", state: "AZ", url: "https://www.glendaleaz.com/police", department: "Glendale Police Department" },
  { city: "Gilbert", state: "AZ", url: "https://www.gilbertaz.gov/departments/police", department: "Gilbert Police Department" },
  { city: "Winston-Salem", state: "NC", url: "https://www.cityofws.org/Departments/Police", department: "Winston-Salem Police Department" },
  { city: "North Las Vegas", state: "NV", url: "https://www.cityofnorthlasvegas.com/our-city/departments/police", department: "North Las Vegas Police Department" },
  { city: "Norfolk", state: "VA", url: "https://www.norfolk.gov/Police", department: "Norfolk Police Department" },
  { city: "Chesapeake", state: "VA", url: "https://www.cityofchesapeake.net/1124/Police-Department", department: "Chesapeake Police Department" },
  { city: "Garland", state: "TX", url: "https://www.garlandtx.gov/558/Police", department: "Garland Police Department" },
  { city: "Irving", state: "TX", url: "https://www.cityofirving.org/344/Police", department: "Irving Police Department" },
  { city: "Hialeah", state: "FL", url: "https://www.hialeahfl.gov/152/Police", department: "Hialeah Police Department" },
  { city: "Fremont", state: "CA", url: "https://www.fremontpolice.gov/", department: "Fremont Police Department" },
  { city: "Baton Rouge", state: "LA", url: "https://www.brla.gov/340/Police-Department", department: "Baton Rouge Police Department" },
  { city: "Richmond", state: "VA", url: "https://www.rva.gov/police", department: "Richmond Police Department" },
  { city: "Boise", state: "ID", url: "https://www.cityofboise.org/departments/police/", department: "Boise Police Department" },
  { city: "Scottsdale", state: "AZ", url: "https://www.scottsdaleaz.gov/police", department: "Scottsdale Police Department" },
  { city: "Spokane", state: "WA", url: "https://my.spokanecity.org/police/", department: "Spokane Police Department" },
  { city: "Des Moines", state: "IA", url: "https://www.dsm.city/departments/police-division/index.php", department: "Des Moines Police Division" },
  { city: "Montgomery", state: "AL", url: "https://www.montgomeryal.gov/government/city-government/departments/police", department: "Montgomery Police Department" },
  { city: "Modesto", state: "CA", url: "https://www.modestopd.com/", department: "Modesto Police Department" },
  { city: "Tacoma", state: "WA", url: "https://www.cityoftacoma.org/government/city_departments/police", department: "Tacoma Police Department" },
  { city: "Fontana", state: "CA", url: "https://www.fontana.org/2159/Police-Department", department: "Fontana Police Department" },
  { city: "Moreno Valley", state: "CA", url: "https://www.moval.org/departments/police/", department: "Moreno Valley Police Department" },
  { city: "Huntsville", state: "AL", url: "https://www.huntsvilleal.gov/government/departments/police/", department: "Huntsville Police Department" },
  { city: "Shreveport", state: "LA", url: "https://www.shreveportla.gov/211/Police", department: "Shreveport Police Department" },
  { city: "Akron", state: "OH", url: "https://www.akronohio.gov/cms/site/1d5e4e5e67e7a42b/index.html", department: "Akron Police Department" },
  { city: "Aurora", state: "IL", url: "https://www.aurora-il.org/232/Police-Department", department: "Aurora Police Department" },
  { city: "Mobile", state: "AL", url: "https://www.cityofmobile.org/government/police-department/", department: "Mobile Police Department" },
  { city: "Grand Rapids", state: "MI", url: "https://www.grandrapidsmi.gov/Government/Departments/Police-Department", department: "Grand Rapids Police Department" },
  { city: "Little Rock", state: "AR", url: "https://www.littlerock.gov/police/", department: "Little Rock Police Department" },
  { city: "Overland Park", state: "KS", url: "https://www.opkansas.org/government/police-department/", department: "Overland Park Police Department" },
  { city: "Tallahassee", state: "FL", url: "https://www.talgov.com/tpd/tpd-index.aspx", department: "Tallahassee Police Department" },
  { city: "Tempe", state: "AZ", url: "https://www.tempe.gov/government/police", department: "Tempe Police Department" },
  { city: "Grand Prairie", state: "TX", url: "https://www.gptx.org/government/departments/police", department: "Grand Prairie Police Department" },
  { city: "Cape Coral", state: "FL", url: "https://www.capecops.com/", department: "Cape Coral Police Department" },
  { city: "Salt Lake City", state: "UT", url: "https://slcpd.com/", department: "Salt Lake City Police Department" },
  { city: "Peoria", state: "AZ", url: "https://www.peoriaaz.gov/government/departments/police", department: "Peoria Police Department" },
  { city: "Knoxville", state: "TN", url: "https://www.knoxvilletn.gov/government/city_departments_offices/police_department", department: "Knoxville Police Department" },
  { city: "Fort Lauderdale", state: "FL", url: "https://www.fortlauderdale.gov/departments/police", department: "Fort Lauderdale Police Department" },
  { city: "Savannah", state: "GA", url: "https://savannahpd.org/", department: "Savannah Police Department" },
  { city: "Naperville", state: "IL", url: "https://www.naperville.il.us/services/police-department/", department: "Naperville Police Department" },
];

/**
 * Find police department URLs by city and state
 */
export function findDepartmentUrlsByCity(city: string, state: string): PoliceDepartmentUrl[] {
  const normalizedCity = city.toLowerCase().trim();
  const normalizedState = state.toLowerCase().trim();

  return POLICE_DEPARTMENT_URLS.filter(dept =>
    dept.city.toLowerCase().trim() === normalizedCity &&
    dept.state.toLowerCase().trim() === normalizedState
  );
}

/**
 * Find all police department URLs for a given state
 */
export function findDepartmentUrlsByState(state: string): PoliceDepartmentUrl[] {
  const normalizedState = state.toLowerCase().trim();
  
  return POLICE_DEPARTMENT_URLS.filter(dept =>
    dept.state.toLowerCase().trim() === normalizedState
  );
}

/**
 * Get all police department URLs (for comprehensive search)
 */
export function getAllDepartmentUrls(): PoliceDepartmentUrl[] {
  return POLICE_DEPARTMENT_URLS;
}
