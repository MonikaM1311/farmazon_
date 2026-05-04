import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const farmIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

// Recenter map when coords change
function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 13); }, [lat, lng]);
  return null;
}

// View-only map for FarmerProfile
export function FarmMapView({ lat, lng, farmerName, location }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-green-100 shadow-md" style={{ height: 320 }}>
      <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />
        <Recenter lat={lat} lng={lng} />
        <Marker position={[lat, lng]} icon={farmIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-bold text-green-800">🌾 {farmerName}'s Farm</p>
              {location && <p className="text-gray-500 text-xs mt-0.5">{location}</p>}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

// Editable map for FarmerDashboard — click to set pin
export function FarmMapPicker({ lat, lng, onChange }) {
  const center = (lat && lng) ? [lat, lng] : [20.5937, 78.9629]; // India center default

  function ClickHandler() {
    const map = useMap();
    useEffect(() => {
      map.on('click', (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }));
      return () => map.off('click');
    }, [map]);
    return null;
  }

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-dashed border-green-300 shadow-sm" style={{ height: 280 }}>
      <MapContainer center={center} zoom={lat ? 13 : 5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />
        <ClickHandler />
        {lat && lng && (
          <Marker position={[lat, lng]} icon={farmIcon}>
            <Popup><p className="text-sm font-semibold text-green-800">📍 Your Farm Location</p></Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
