// ✅ COMPLETE Ireland counties ke areas ki data
export const COUNTY_AREAS: Record<string, string[]> = {
  "Carlow": ["Carlow Town", "Bagenalstown", "Tullow", "Borris", "Leighlinbridge", "Ballon", "Rathvilly"],
  "Cavan": ["Cavan Town", "Ballyjamesduff", "Belturbet", "Cootehill", "Kingscourt", "Shercock", "Virginia"],
  "Clare": ["Ennis", "Kilrush", "Shannon", "Killaloe", "Newmarket-on-Fergus", "Ennistymon", "Lahinch", "Kilkee"],
  "Cork": ["Cork City", "Mallow", "Midleton", "Cobh", "Fermoy", "Youghal", "Bandon", "Kinsale", "Clonakilty", "Macroom", "Skibbereen", "Passage West"],
  "Donegal": ["Letterkenny", "Buncrana", "Ballybofey", "Bundoran", "Donegal Town", "Dungloe", "Moville", "Carndonagh", "Lifford"],
  "Dublin": [
    "Dublin City Centre", "Clontarf", "Rathmines", "Phibsborough", "Kilmainham", "Inchicore",
    "Dún Laoghaire", "Blackrock", "Dalkey", "Sandycove", "Killiney", "Booterstown",
    "Swords", "Malahide", "Portmarnock", "Skerries", "Rush", "Lusk",
    "Tallaght", "Clondalkin", "Lucan", "Palmerstown", "Rathcoole", "Saggart",
    "Blanchardstown", "Castleknock", "Mulhuddart", "Tyrrelstown", "Hollystown",
    "Howth", "Raheny", "Marino", "Drumcondra", "Glasnevin", "Ballymun", "Finglas",
    "Ballyfermot", "Crumlin", "Walkinstown", "Kimmage", "Terenure", "Rathgar",
    "Rathfarnham", "Templeogue", "Dundrum", "Ballinteer", "Stillorgan", "Mount Merrion",
    "Goatstown", "Churchtown", "Clonskeagh", "Milltown", "Ranelagh", "Harold's Cross"
  ],
  "Galway": ["Galway City", "Loughrea", "Ballinasloe", "Tuam", "Oranmore", "Clifden", "Athenry", "Gort", "Headford"],
  "Kerry": ["Tralee", "Killarney", "Listowel", "Dingle", "Kenmare", "Castleisland", "Cahersiveen", "Ballybunion"],
  "Kildare": ["Naas", "Newbridge", "Athy", "Kildare", "Leixlip", "Maynooth", "Celbridge", "Clane", "Kilcock"],
  "Kilkenny": ["Kilkenny City", "Callan", "Thomastown", "Castlecomer", "Ballyragget", "Graiguenamanagh", "Freshford"],
  "Laois": ["Portlaoise", "Portarlington", "Mountmellick", "Abbeyleix", "Mountrath", "Stradbally", "Durrow"],
  "Leitrim": ["Carrick-on-Shannon", "Ballinamore", "Manorhamilton", "Drumshanbo", "Mohill", "Kinlough"],
  "Limerick": ["Limerick City", "Newcastle West", "Kilmallock", "Rathkeale", "Abbeyfeale", "Adare", "Askeaton", "Patrickswell"],
  "Longford": ["Longford Town", "Ballymahon", "Granard", "Edgeworthstown", "Lanesborough", "Newtownforbes"],
  "Louth": ["Drogheda", "Dundalk", "Ardee", "Dunleer", "Carlingford", "Clogherhead"],
  "Mayo": ["Castlebar", "Ballina", "Westport", "Claremorris", "Ballinrobe", "Swinford", "Kiltimagh", "Foxford"],
  "Meath": ["Navan", "Trim", "Kells", "Ashbourne", "Dunboyne", "Duleek", "Slane", "Athboy", "Ratoath", "Laytown"],
  "Monaghan": ["Monaghan Town", "Carrickmacross", "Castleblayney", "Clones", "Ballybay", "Emyvale"],
  "Offaly": ["Tullamore", "Birr", "Edenderry", "Banagher", "Ferbane", "Kilcormac", "Clara"],
  "Roscommon": ["Roscommon Town", "Boyle", "Castlerea", "Ballaghaderreen", "Strokestown", "Monksland", "Athleague"],
  "Sligo": ["Sligo Town", "Tubbercurry", "Ballymote", "Collooney", "Strandhill", "Rosses Point", "Enniscrone"],
  "Tipperary": ["Clonmel", "Nenagh", "Thurles", "Tipperary Town", "Carrick-on-Suir", "Cahir", "Cashel", "Roscrea", "Templemore"],
  "Waterford": ["Waterford City", "Tramore", "Dungarvan", "Portlaw", "Kilmacthomas", "Lismore", "Clonea"],
  "Westmeath": ["Athlone", "Mullingar", "Moate", "Kilbeggan", "Castlepollard", "Tyrellspass", "Rochfortbridge"],
  "Wexford": ["Wexford Town", "Enniscorthy", "New Ross", "Gorey", "Courtown", "Bunclody", "Rosslare", "Kilmore"],
  "Wicklow": ["Bray", "Greystones", "Wicklow Town", "Arklow", "Blessington", "Newtownmountkennedy", "Aughrim", "Rathdrum", "Ashford"]
};

export const COUNTIES = Object.keys(COUNTY_AREAS).sort();
