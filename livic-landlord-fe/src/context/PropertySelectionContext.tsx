import React, { createContext, useContext, useState } from 'react';

interface PropertySelectionContextType {
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string | null) => void;
  selectedBlockId: string | null;
  setSelectedBlockId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const PropertySelectionContext = createContext<PropertySelectionContextType>({
  selectedPropertyId: null,
  setSelectedPropertyId: () => {},
  selectedBlockId: null,
  setSelectedBlockId: () => {},
  searchQuery: '',
  setSearchQuery: () => {},
});

export function PropertySelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedPropertyId, setSelectedPropertyIdState] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const setSelectedPropertyId = (id: string | null) => {
    setSelectedPropertyIdState(id);
    setSelectedBlockId(null); // Reset active block when changing property
  };

  return (
    <PropertySelectionContext.Provider
      value={{
        selectedPropertyId,
        setSelectedPropertyId,
        selectedBlockId,
        setSelectedBlockId,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </PropertySelectionContext.Provider>
  );
}

export function useGlobalPropertySelection() {
  return useContext(PropertySelectionContext);
}
