"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers in React Leaflet
const iconDefault = L.Icon.Default.prototype as L.Icon.Default & {
  _getIconUrl?: unknown;
};
delete iconDefault._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function EventsMap() {
  // Cluj-Napoca coordinates
  const clujCenter: [number, number] = [46.7712, 23.6236];
  const defaultZoom = 13;

  useEffect(() => {
    // Force a window resize event after component mounts to ensure map renders correctly
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);
  }, []);

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={clujCenter}
        zoom={defaultZoom}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Example marker for Cluj-Napoca center */}
        <Marker position={clujCenter}>
          <Popup>
            <div className="text-center">
              <strong>Cluj-Napoca</strong>
              <br />
              Centrul orașului
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
