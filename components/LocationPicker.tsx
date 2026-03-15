import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  defaultLocation?: { lat: number, lng: number };
}

// Sub-component to handle map clicks
const MapEvents = ({ onSelect }: { onSelect: (latlng: L.LatLng) => void }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
};

// Helper to center the map when defaultLocation changes
const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
     map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, defaultLocation }) => {
  const [position, setPosition] = useState<L.LatLng | null>(
      defaultLocation ? L.latLng(defaultLocation.lat, defaultLocation.lng) : null
  );

  const handleSelect = (latlng: L.LatLng) => {
    setPosition(latlng);
    onLocationSelect(latlng.lat, latlng.lng);
  };

  const center: [number, number] = position ? [position.lat, position.lng] : [41.9028, 12.4964]; // default to Rome

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 relative z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <ChangeView center={center} />
        <MapEvents onSelect={handleSelect} />
        {position && <Marker position={position} />}
      </MapContainer>
      
      {!position && (
          <div className="absolute top-4 left-0 right-0 z-[1000] pointer-events-none flex justify-center">
              <div className="bg-gray-900/80 text-white px-4 py-2 rounded-full text-xs font-bold backdrop-blur-sm shadow-lg">
                  Click on the map to pin a location
              </div>
          </div>
      )}
    </div>
  );
};

export default LocationPicker;
