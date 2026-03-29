import { useState, useEffect } from 'react';
import { MerchantLocation, CafeLocationFormData, IOpeningHours, IAccessibility } from '@/types/merchant';
import { COUNTY_AREAS } from '@/constants/locations';

interface CafeLocationModalProps {
  isOpen: boolean;
  editingLocation: MerchantLocation | null;
  formData: CafeLocationFormData;
  onFormDataChange: (data: CafeLocationFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function CafeLocationModal({
  isOpen,
  editingLocation,
  formData,
  onFormDataChange,
  onSubmit,
  onClose
}: CafeLocationModalProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'hours' | 'accessibility'>('basic');
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);

  if (!isOpen) return null;

  // ✅ County change hone par areas update karne ka useEffect
  useEffect(() => {
    console.log('County changed:', formData.county);

    if (formData.county && COUNTY_AREAS[formData.county]) {
      const areas = COUNTY_AREAS[formData.county];
      console.log('Available areas for', formData.county, ':', areas);
      setAvailableAreas([...areas].sort());

      // ✅ Edit mode check - agar existing area current county ke areas mein nahi hai
      if (editingLocation && formData.area && !areas.includes(formData.area) && formData.area !== 'other') {
        console.log('Area not in list, switching to "other"');
        onFormDataChange({
          ...formData,
          area: 'other',
          customArea: formData.area
        });
      }
    } else {
      console.log('No areas found for county:', formData.county);
      setAvailableAreas([]);
    }
  }, [formData.county, editingLocation]); // ✅ Only run when county changes

  // ✅ County select hone par areas update karne ka function
  const handleCountyChange = (county: string) => {
    console.log('County selected:', county);

    // Form data update karo (area reset karo)
    onFormDataChange({
      ...formData,
      county,
      area: '',
      customArea: ''
    });

    // Available areas set karo
    if (county && COUNTY_AREAS[county]) {
      const areas = COUNTY_AREAS[county];
      console.log('Setting available areas:', areas);
      setAvailableAreas([...areas].sort());
    } else {
      console.log('No areas for county, clearing');
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

  // ✅ Area select hone par customArea handle karo
  const handleAreaChange = (area: string) => {
    if (area === 'other') {
      // "Other" select kiya to customArea field show karo
      onFormDataChange({
        ...formData,
        area: 'other',
        customArea: formData.customArea || ''
      });
    } else {
      // Predefined area select kiya to customArea clear karo
      onFormDataChange({
        ...formData,
        area: area,
        customArea: ''
      });
    }
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location Name *</label>
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
                    value={formData.phoneNumber || ''}
                    onChange={(e) => onFormDataChange({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
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

                {/* Area field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area / Town *
                    {formData.county && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({availableAreas.length} areas available)
                      </span>
                    )}
                  </label>
                  <select
                    value={formData.area || ''}
                    onChange={(e) => handleAreaChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
                    required
                    disabled={!formData.county}
                  >
                    <option value="">
                      {formData.county
                        ? `Select ${formData.county} Area`
                        : 'Select County First'}
                    </option>
                    {availableAreas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                    {/* Custom area ka option agar koi specific area list mein na ho */}
                    <option value="other">Other (Specify custom area)</option>
                  </select>

                  {/* Agar user "Other" select kare to custom area input show karo */}
                  {formData.area === 'other' && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Area Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter area/town name"
                        value={formData.customArea || ''}
                        onChange={(e) => onFormDataChange({ ...formData, customArea: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the specific area or town name not listed above
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code / Eircode</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => onFormDataChange({ ...formData, zipCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-black"
                  placeholder="e.g., D01 AB12"
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
                  <div className="w-24 text-sm font-medium text-gray-700">
                    {DAY_LABELS[index]}
                  </div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.openingHours[day].closed}
                      onChange={(e) => handleOpeningHoursChange(day, 'closed', e.target.checked)}
                      className="mr-2 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
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
              <p className="text-xs text-gray-500 mt-2">
                * All times are in 24-hour format
              </p>
            </div>
          )}

          {/* Accessibility Tab */}
          {activeTab === 'accessibility' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">Select the accessibility features available at this location</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData.accessibility).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleAccessibilityChange(key as keyof IAccessibility, e.target.checked)}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
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
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              {editingLocation ? 'Update Location' : 'Add Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}