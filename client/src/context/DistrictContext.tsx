import React, { createContext, useContext, useState, useEffect } from 'react';

interface DistrictContextType {
  districtId: string;
  districtName: string;
  setDistrict: (id: string) => void;
  availableDistricts: { id: string; name: string }[];
}

const DISTRICTS = [
  { id: 'chennai', name: 'Chennai' },
  { id: 'chengalpattu', name: 'Chengalpattu' },
  { id: 'kanchipuram', name: 'Kanchipuram' }
];

const DistrictContext = createContext<DistrictContextType>({
  districtId: 'chennai',
  districtName: 'Chennai',
  setDistrict: () => {},
  availableDistricts: DISTRICTS
});

export const DistrictProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [districtId, setDistrictId] = useState<string>(() => {
    return localStorage.getItem('cineaura_district') || 'chennai';
  });

  const currentDistrict = DISTRICTS.find(d => d.id === districtId) || DISTRICTS[0];

  const setDistrict = (id: string) => {
    setDistrictId(id);
    localStorage.setItem('cineaura_district', id);
  };

  return (
    <DistrictContext.Provider
      value={{
        districtId: currentDistrict.id,
        districtName: currentDistrict.name,
        setDistrict,
        availableDistricts: DISTRICTS
      }}
    >
      {children}
    </DistrictContext.Provider>
  );
};

export const useDistrict = () => useContext(DistrictContext);
