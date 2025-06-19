import { CarInfo } from "@/types/booking";

interface CarInfoFormProps {
  carInfo: CarInfo;
  handleCarInfoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  vehicles?: any[];
  onSelectVehicle?: (vehicle: any) => void;
  loadingVehicles?: boolean;
}

import React, { useState, useEffect } from "react";

const CarInfoForm = ({ carInfo, handleCarInfoChange, vehicles = [], onSelectVehicle, loadingVehicles = false }: CarInfoFormProps) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");

  useEffect(() => {
    // Если carInfo совпадает с каким-то авто — выставить его id
    if (vehicles.length > 0 && carInfo && carInfo.make) {
      const found = vehicles.find(
        v =>
          v.make === carInfo.make &&
          v.model === carInfo.model &&
          String(v.year) === String(carInfo.year)
      );
      if (found) setSelectedVehicleId(found.id);
    }
  }, [carInfo, vehicles]);

  return (
    <div className="animate-fade-in">
      <h3 className="text-lg font-semibold mb-4">Информация об автомобиле</h3>
      {/* Список автомобилей пользователя */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1.5">Выберите автомобиль из гаража</label>
        <select
          className="w-full p-2.5 rounded-md border border-input bg-background"
          onChange={e => {
            setSelectedVehicleId(e.target.value);
            const selected = vehicles.find(v => v.id === e.target.value);
            if (selected && onSelectVehicle) onSelectVehicle(selected);
          }}
          value={selectedVehicleId}
          disabled={loadingVehicles}
        >
          {loadingVehicles ? (
            <option value="">Загрузка...</option>
          ) : vehicles.length > 0 ? (
            <>
              <option value="">Выберите...</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.brand || vehicle.make} {vehicle.model} {vehicle.year}
                </option>
              ))}
            </>
          ) : (
            <option value="">Нет автомобилей</option>
          )}
        </select>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Марка автомобиля</label>
          <input
            type="text"
            name="make"
            value={carInfo.make}
            onChange={handleCarInfoChange}
            placeholder="Например: Toyota"
            className="w-full p-2.5 rounded-md border border-input bg-background"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1.5">Модель</label>
          <input
            type="text"
            name="model"
            value={carInfo.model}
            onChange={handleCarInfoChange}
            placeholder="Например: Camry"
            className="w-full p-2.5 rounded-md border border-input bg-background"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1.5">Год выпуска</label>
          <input
            type="text"
            name="year"
            value={carInfo.year}
            onChange={handleCarInfoChange}
            placeholder="Например: 2020"
            className="w-full p-2.5 rounded-md border border-input bg-background"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1.5">VIN номер (опционально)</label>
          <input
            type="text"
            name="vin"
            value={carInfo.vin}
            onChange={handleCarInfoChange}
            placeholder="VIN номер автомобиля"
            className="w-full p-2.5 rounded-md border border-input bg-background"
          />
        </div>
      </div>
    </div>
  );
};

export default CarInfoForm;
