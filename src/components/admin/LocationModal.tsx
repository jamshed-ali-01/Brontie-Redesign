import { useState, useEffect } from 'react';
import { MerchantLocation, LocationFormData, IOpeningHours, IAccessibility } from '@/types/merchant';

interface LocationModalProps {
  isOpen: boolean;
  editingLocation: MerchantLocation | null;
  formData: LocationFormData;
  onFormDataChange: (data: LocationFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Ireland counties ke areas ki data
const COUNTY_AREAS: Record<string, string[]> = {
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

export default function LocationModal({
  isOpen,
  editingLocation,
  formData,
  onFormDataChange,
  onSubmit,
  onClose
}: LocationModalProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'hours' | 'accessibility'>('basic');
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);

  if (!isOpen) return null;

  // ✅ Naya useEffect add karo - Edit mode mein area dropdown properly set karne ke liye
  useEffect(() => {

    console.log(formData);
    if (formData.county && COUNTY_AREAS[formData.county]) {
      setAvailableAreas([...COUNTY_AREAS[formData.county]].sort());

      // ✅ Agar editing mode mein hain aur area value COUNTY_AREAS list mein nahi hai
      // to "other" option automatically select karo
      if (editingLocation && formData.area && !COUNTY_AREAS[formData.county].includes(formData.area) && formData.area !== 'other') {
        onFormDataChange({
          ...formData,
          area: 'other',
          customArea: formData.area // Existing area ko customArea mein move karo
        });
      }
    } else {
      setAvailableAreas([]);
    }
  }, [formData.county, editingLocation]); // ✅ Dependencies add karo

  // County select hone par areas update karne ka function
  const handleCountyChange = (county: string) => {
    // Form data update karo
    onFormDataChange({ ...formData, county, area: '' }); // Area reset karo jab county change ho

    // Available areas set karo
    if (county && COUNTY_AREAS[county]) {
      setAvailableAreas([...COUNTY_AREAS[county]].sort());
    } else {
      setAvailableAreas([]);
    }
  };

  const handleOpeningHoursChange = (day: keyof IOpeningHours, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    const updatedHours = {
      ...formData.openingHours,
      [day]: {
        ...formData.openingHours[day],
        [field]: value
      }
    };
    onFormDataChange({ ...formData, openingHours: updatedHours });
  };

  const handleAccessibilityChange = (field: keyof IAccessibility, value: boolean) => {
    const updatedAccessibility = {
      ...formData.accessibility,
      [field]: value
    };
    onFormDataChange({ ...formData, accessibility: updatedAccessibility });
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {editingLocation ? 'Edit Location' : 'Add Location'}
        </h2>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`pb-2 px-1 ${activeTab === 'basic' ? 'border-b-2 border-amber-500 text-amber-600' : 'text-gray-600'}`}
          >
            Basic Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hours')}
            className={`pb-2 px-1 ${activeTab === 'hours' ? 'border-b-2 border-amber-500 text-amber-600' : 'text-gray-600'}`}
          >
            Opening Hours
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('accessibility')}
            className={`pb-2 px-1 ${activeTab === 'accessibility' ? 'border-b-2 border-amber-500 text-amber-600' : 'text-gray-600'}`}
          >
            Accessibility
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => onFormDataChange({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => onFormDataChange({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">County *</label>
                  <select
                    value={formData.county}
                    onChange={(e) => handleCountyChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
                    required
                  >
                    <option value="">Select County</option>
                    <option value="Carlow">Carlow</option>
                    <option value="Cavan">Cavan</option>
                    <option value="Clare">Clare</option>
                    <option value="Cork">Cork</option>
                    <option value="Donegal">Donegal</option>
                    <option value="Dublin">Dublin</option>
                    <option value="Galway">Galway</option>
                    <option value="Kerry">Kerry</option>
                    <option value="Kildare">Kildare</option>
                    <option value="Kilkenny">Kilkenny</option>
                    <option value="Laois">Laois</option>
                    <option value="Leitrim">Leitrim</option>
                    <option value="Limerick">Limerick</option>
                    <option value="Longford">Longford</option>
                    <option value="Louth">Louth</option>
                    <option value="Mayo">Mayo</option>
                    <option value="Meath">Meath</option>
                    <option value="Monaghan">Monaghan</option>
                    <option value="Offaly">Offaly</option>
                    <option value="Roscommon">Roscommon</option>
                    <option value="Sligo">Sligo</option>
                    <option value="Tipperary">Tipperary</option>
                    <option value="Waterford">Waterford</option>
                    <option value="Westmeath">Westmeath</option>
                    <option value="Wexford">Wexford</option>
                    <option value="Wicklow">Wicklow</option>
                  </select>
                </div>

                {/* Naya Area field add kiya */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Area / Town * </label>
                  <select
                    value={formData.area || ''}
                    onChange={(e) => onFormDataChange({ ...formData, area: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
                    required
                    disabled={!formData.county}
                  >
                    <option value="">{formData.county ? `Select ${formData.county} Area` : 'Select County First'}</option>
                    {availableAreas.map((area) => (
                      <option key={area} value={area}  >
                        {area}
                      </option>
                    ))}
                    {/* Custom area ka option agar koi specific area list mein na ho */}
                    <option value="other">Other (Specify)</option>
                  </select>

                  {/* Agar user "Other" select kare to custom area input show karo */}
                  {formData.area === 'other' && (
                    <input
                      type="text"
                      placeholder="Enter area/town name"
                      value={formData.customArea || ''}
                      onChange={(e) => onFormDataChange({ ...formData, customArea: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black mt-2"
                      required
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => onFormDataChange({ ...formData, zipCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
                />
              </div>

            </div>
          )}

          {/* Opening Hours Tab */}
          {activeTab === 'hours' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">Set the opening hours for each day of the week</p>
              {DAYS.map((day, index) => (
                <div key={day} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-20 text-sm font-medium text-gray-700">
                    {DAY_LABELS[index]}
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.openingHours[day].closed}
                      onChange={(e) => handleOpeningHoursChange(day, 'closed', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Closed</span>
                  </label>
                  {!formData.openingHours[day].closed && (
                    <>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">Open:</label>
                        <input
                          type="time"
                          value={formData.openingHours[day].open}
                          onChange={(e) => handleOpeningHoursChange(day, 'open', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm text-black"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm text-gray-600">Close:</label>
                        <input
                          type="time"
                          value={formData.openingHours[day].close}
                          onChange={(e) => handleOpeningHoursChange(day, 'close', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm text-black"
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Accessibility Tab */}
          {activeTab === 'accessibility' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">Select the accessibility features available at this location</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData.accessibility).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleAccessibilityChange(key as keyof IAccessibility, e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              {editingLocation ? 'Update' : 'Add'} Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}