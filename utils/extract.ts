interface AddressComponent {
  longText: string;
  shortText: string;
  types: string[];
  languageCode: string;
}

interface AddressInfo {
  street: string | null;
  commune: string | null;
  district: string | null;
  city: string | null;
}

export const extractAddressInfo = (
  addressComponents: AddressComponent[]
): AddressInfo => {
  let result: AddressInfo = {
    street: null,
    commune: null,
    district: null,
    city: null,
  };

  addressComponents.forEach((component: AddressComponent) => {
    const types = component.types;

    if (types.includes("route")) {
      result.street = component.longText;
    } else if (
      types.includes("sublocality") ||
      types.includes("sublocality_level_1")
    ) {
      result.commune = component.longText;
    } else if (
      types.includes("administrative_area_level_2") ||
      types.includes("locality")
    ) {
      result.district = component.longText;
    } else if (types.includes("administrative_area_level_1")) {
      result.city = component.longText;
    }
  });

  return result;
};
