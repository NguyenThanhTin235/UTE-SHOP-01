import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

// Map Icons
const shopIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const FitBounds = ({ routeCoordinates, shopPos, customerPos }) => {
  const map = useMap();
  useEffect(() => {
    if (routeCoordinates && routeCoordinates.length > 0) {
      const bounds = L.latLngBounds(routeCoordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (shopPos && customerPos) {
      const bounds = L.latLngBounds([shopPos, customerPos]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, routeCoordinates, shopPos, customerPos]);
  return null;
};

const RouteMap = ({ shopLat, shopLng, customerLat, customerLng, shopName, customerName }) => {
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [loading, setLoading] = useState(true);

  const shopPos = [shopLat, shopLng];
  const customerPos = [customerLat, customerLng];

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        setLoading(true);
        // OSRM expects coordinates in lon,lat order
        const url = `http://router.project-osrm.org/route/v1/driving/${shopLng},${shopLat};${customerLng},${customerLat}?overview=full&geometries=geojson`;
        const res = await axios.get(url);
        
        if (res.data.code === 'Ok' && res.data.routes.length > 0) {
          const route = res.data.routes[0];
          
          // OSRM geojson returns [lng, lat], Leaflet Polyline expects [lat, lng]
          const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
          setRouteCoordinates(coords);
          
          setDistance((route.distance / 1000).toFixed(1)); // in km
          setDuration(Math.ceil(route.duration / 60)); // in minutes
        }
      } catch (error) {
        console.error('Failed to fetch route from OSRM', error);
      } finally {
        setLoading(false);
      }
    };

    if (shopLat && shopLng && customerLat && customerLng) {
      fetchRoute();
    } else {
      setLoading(false);
    }
  }, [shopLat, shopLng, customerLat, customerLng]);

  if (!shopLat || !shopLng || !customerLat || !customerLng) {
    return (
      <div className="w-full h-[400px] bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">location_off</span>
          <p className="text-slate-500 font-medium">Map data unavailable due to missing coordinates.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm z-0">
      {loading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-[1000] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-[#004ac6] border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-sm font-bold text-slate-700">Calculating route...</p>
          </div>
        </div>
      )}

      {/* Info overlay */}
      {!loading && routeCoordinates.length > 0 && (
        <div className="absolute top-4 right-4 z-[1000] bg-white px-4 py-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-4 animate-fade-in">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Distance</span>
            <span className="text-sm font-bold text-slate-800">{distance} km</span>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Est. Time</span>
            <span className="text-sm font-bold text-[#004ac6]">{duration} mins</span>
          </div>
        </div>
      )}

      <MapContainer 
        center={shopPos} 
        zoom={13} 
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <Marker position={shopPos} icon={shopIcon}>
          <Popup>
            <div className="font-bold text-amber-600">Pickup: {shopName}</div>
          </Popup>
        </Marker>

        <Marker position={customerPos} icon={customerIcon}>
          <Popup>
            <div className="font-bold text-[#004ac6]">Drop-off: {customerName}</div>
          </Popup>
        </Marker>

        {routeCoordinates.length > 0 && (
          <Polyline 
            positions={routeCoordinates} 
            color="#004ac6" 
            weight={5} 
            opacity={0.7} 
            dashArray="10, 10" 
            lineCap="round"
          />
        )}

        <FitBounds routeCoordinates={routeCoordinates} shopPos={shopPos} customerPos={customerPos} />
      </MapContainer>
    </div>
  );
};

export default RouteMap;
