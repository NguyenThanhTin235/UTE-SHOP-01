import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Fix for default Leaflet marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapClickHandler = ({ setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

const MapPicker = ({ isOpen, onClose, onConfirm, initialLat, initialLng }) => {
  const defaultPosition = [10.8231, 106.6297]; // HCMC Default
  const [position, setPosition] = useState(initialLat && initialLng ? [initialLat, initialLng] : defaultPosition);
  const [addressText, setAddressText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition([initialLat, initialLng]);
    }
  }, [initialLat, initialLng]);

  // Reverse Geocoding (Lat/Lng -> Address String)
  useEffect(() => {
    const fetchAddress = async () => {
      setLoading(true);
      try {
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
          params: {
            lat: position[0],
            lon: position[1],
            format: 'json',
            addressdetails: 1,
            'accept-language': 'en'
          }
        });
        if (response.data && response.data.address) {
          const { address } = response.data;
          const parts = [];
          if (address.house_number) parts.push(address.house_number);
          if (address.road) parts.push(address.road);
          if (address.quarter || address.suburb || address.neighbourhood) parts.push(address.quarter || address.suburb || address.neighbourhood);
          if (address.city_district || address.district || address.county) parts.push(address.city_district || address.district || address.county);
          if (address.city || address.town || address.village || address.municipality) parts.push(address.city || address.town || address.village || address.municipality);
          if (address.state || address.province) parts.push(address.state || address.province);
          if (address.country) parts.push(address.country);
          
          const uniqueParts = [...new Set(parts)].filter(Boolean);
          const formattedAddress = uniqueParts.join(', ');
          
          setAddressText(formattedAddress || response.data.display_name);
        } else if (response.data && response.data.display_name) {
          setAddressText(response.data.display_name);
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAddress();
  }, [position]);

  // Autocomplete debounced fetch
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: searchQuery,
            format: 'json',
            addressdetails: 1,
            limit: 5,
            'accept-language': 'en'
          }
        });
        setSuggestions(response.data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Autocomplete error:", error);
      }
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const handleSelectSuggestion = (suggestion) => {
    const { lat, lon, address, display_name } = suggestion;
    const newPos = [parseFloat(lat), parseFloat(lon)];
    setPosition(newPos);
    
    if (address) {
      const parts = [];
      if (address.house_number) parts.push(address.house_number);
      if (address.road) parts.push(address.road);
      if (address.quarter || address.suburb || address.neighbourhood) parts.push(address.quarter || address.suburb || address.neighbourhood);
      if (address.city_district || address.district || address.county) parts.push(address.city_district || address.district || address.county);
      if (address.city || address.town || address.village || address.municipality) parts.push(address.city || address.town || address.village || address.municipality);
      if (address.state || address.province) parts.push(address.state || address.province);
      if (address.country) parts.push(address.country);
      
      const uniqueParts = [...new Set(parts)].filter(Boolean);
      setAddressText(uniqueParts.join(', ') || display_name);
    } else {
      setAddressText(display_name);
    }
    
    setSearchQuery('');
    setShowSuggestions(false);
    
    if (mapRef.current) {
      mapRef.current.flyTo(newPos, 16);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: searchQuery,
          format: 'json',
          addressdetails: 1,
          limit: 1,
          'accept-language': 'en'
        }
      });
      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        const { lat, lon, address, display_name } = result;
        const newPos = [parseFloat(lat), parseFloat(lon)];
        setPosition(newPos);
        
        if (address) {
          const parts = [];
          if (address.house_number) parts.push(address.house_number);
          if (address.road) parts.push(address.road);
          if (address.quarter || address.suburb || address.neighbourhood) parts.push(address.quarter || address.suburb || address.neighbourhood);
          if (address.city_district || address.district || address.county) parts.push(address.city_district || address.district || address.county);
          if (address.city || address.town || address.village || address.municipality) parts.push(address.city || address.town || address.village || address.municipality);
          if (address.state || address.province) parts.push(address.state || address.province);
          if (address.country) parts.push(address.country);
          
          const uniqueParts = [...new Set(parts)].filter(Boolean);
          setAddressText(uniqueParts.join(', ') || display_name);
        } else {
          setAddressText(display_name);
        }
        
        if (mapRef.current) {
          mapRef.current.flyTo(newPos, 16);
        }
      } else {
        alert("Location not found!");
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      lat: position[0],
      lng: position[1],
      addressString: addressText
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6]">map</span>
            Select Location on Map
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex gap-2 relative">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2 relative z-50">
            <input 
              type="text" 
              placeholder="Search for a location, street name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#004ac6] focus:border-[#004ac6] outline-none"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-[#004ac6] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#003896] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-sm">search</span>
              )}
              Search
            </button>
          </form>
          
          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute top-full left-4 right-4 bg-white shadow-xl rounded-lg border border-gray-200 mt-1 max-h-60 overflow-y-auto z-[10000]">
              {suggestions.map((s, idx) => (
                <li 
                  key={idx} 
                  onClick={() => handleSelectSuggestion(s)}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-start gap-2"
                >
                  <span className="material-symbols-outlined text-gray-400 text-lg mt-0.5">location_on</span>
                  <p className="text-sm font-medium text-gray-700 line-clamp-2">{s.display_name}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 relative w-full bg-gray-100">
          <MapContainer 
            center={position} 
            zoom={13} 
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} />
            <MapClickHandler setPosition={setPosition} />
          </MapContainer>
        </div>

        {/* Footer info & confirm */}
        <div className="p-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Pinned Address</p>
            <p className="text-sm font-medium text-gray-800 line-clamp-2">
              {loading ? "Loading address..." : (addressText || "No address data")}
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={onClose}
              className="px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors flex-1 sm:flex-none text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              className="px-6 py-3 bg-[#004ac6] text-white font-bold rounded-xl hover:bg-[#003896] transition-colors shadow-lg shadow-[#004ac6]/30 flex-1 sm:flex-none text-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPicker;
