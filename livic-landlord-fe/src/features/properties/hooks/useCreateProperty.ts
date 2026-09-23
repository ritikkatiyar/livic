import { useState, useRef } from 'react';
import { Animated, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createProperty } from '@/src/features/properties/api/property.api';
import { generateBatchUnits } from '@/src/features/properties/api/unit.api';
import { uploadAndConfirmMedia } from '@/src/features/storage/api/media.api';
import { StagedMediaItem } from '@/src/components/common/display/MediaUploadGrid';

interface UseCreatePropertyProps {
  userToken: string;
  onSaveAndConfigure?: (propertyId: string, totalFloors?: number) => void;
  /** Called instead when the landlord said the property has several blocks. */
  onSaveAndAddBlocks?: (propertyId: string) => void;
}

export function useCreateProperty({ userToken, onSaveAndConfigure, onSaveAndAddBlocks }: UseCreatePropertyProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [landmark, setLandmark] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  /** Off means one block called Main, which the landlord never sees. */
  const [hasMultipleBlocks, setHasMultipleBlocks] = useState(false);
  const [autoBillDayOfMonth, setAutoBillDayOfMonth] = useState('1');
  const [globalUnitsPerFloor, setGlobalUnitsPerFloor] = useState('');
  const [globalUnitType, setGlobalUnitType] = useState('SINGLE_UNIT');
  const [stagedPhotos, setStagedPhotos] = useState<StagedMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'High-speed Fiber Wi-Fi',
    'Covered Parking',
    '24/7 Security',
    'Power Backup'
  ]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const shakeName = useRef(new Animated.Value(0)).current;
  const shakeAddress = useRef(new Animated.Value(0)).current;
  const shakeCity = useRef(new Animated.Value(0)).current;
  const shakeFloors = useRef(new Animated.Value(0)).current;

  const triggerShake = (anim: Animated.Value) => {
    anim.setValue(0);
    Animated.sequence([
      Animated.timing(anim, { toValue: 15, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -15, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 15, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: -15, duration: 60, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 60, useNativeDriver: true })
    ]).start();
  };

  const handleSave = async (scrollViewRef: React.RefObject<ScrollView | null>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let hasError = false;
    let firstErrorField = null;

    if (!name) { hasError = true; triggerShake(shakeName); if (!firstErrorField) firstErrorField = 'name'; }
    if (!address) { hasError = true; triggerShake(shakeAddress); if (!firstErrorField) firstErrorField = 'address'; }
    if (!city) { hasError = true; triggerShake(shakeCity); if (!firstErrorField) firstErrorField = 'city'; }
    if (!hasMultipleBlocks && (!totalFloors || parseInt(totalFloors, 10) < 1)) { 
      hasError = true; triggerShake(shakeFloors); if (!firstErrorField) firstErrorField = 'floors'; 
    }

    if (hasError) {
      setShowErrors(true);
      setErrorMsg('Please fill in all required fields properly.');
      
      if (firstErrorField === 'floors') {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      } else {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setShowErrors(false);

    try {
      const property = await createProperty({
        token: userToken,
        property: {
          name,
          address,
          city,
          landmark,
          totalFloors: hasMultipleBlocks ? undefined : parseInt(totalFloors, 10),
          autoBillDayOfMonth: autoBillDayOfMonth ? parseInt(autoBillDayOfMonth, 10) : null,
          amenities: selectedAmenities
        },
      });

      if (!hasMultipleBlocks && globalUnitsPerFloor && parseInt(globalUnitsPerFloor, 10) > 0) {
        await generateBatchUnits(property.id, {
          totalFloors: parseInt(totalFloors, 10),
          unitsPerFloor: parseInt(globalUnitsPerFloor, 10),
          startingFloorNumber: 1,
          prefix: '',
          capacity: 1,
          unitType: globalUnitType
        }, userToken);
      }

      if (stagedPhotos.length > 0) {
        for (const photo of stagedPhotos) {
          try {
            await uploadAndConfirmMedia(
              photo,
              {
                ownerModule: 'PROPERTY',
                referenceId: property.id,
                fileType: 'IMAGE',
              },
              userToken
            );
          } catch (uploadErr) {
            console.warn('Failed to upload photo during property creation:', uploadErr);
          }
        }
      }

      if (hasMultipleBlocks && onSaveAndAddBlocks) {
        onSaveAndAddBlocks(property.id);
      } else if (onSaveAndConfigure) {
        onSaveAndConfigure(property.id, parseInt(totalFloors, 10));
      }
    } catch (error: any) {
      console.error('Create Property Error:', error);
      setErrorMsg(error.message || 'Cannot connect to server. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return {
    name,
    setName,
    address,
    setAddress,
    city,
    setCity,
    landmark,
    setLandmark,
    totalFloors,
    setTotalFloors,
    hasMultipleBlocks,
    setHasMultipleBlocks,
    autoBillDayOfMonth,
    setAutoBillDayOfMonth,
    globalUnitsPerFloor,
    setGlobalUnitsPerFloor,
    globalUnitType,
    setGlobalUnitType,
    stagedPhotos,
    setStagedPhotos,
    selectedAmenities,
    toggleAmenity,
    loading,
    errorMsg,
    setErrorMsg,
    showErrors,
    setShowErrors,
    shakeName,
    shakeAddress,
    shakeCity,
    shakeFloors,
    handleSave,
  };
}
