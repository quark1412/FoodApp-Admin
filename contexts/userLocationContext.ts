import { createContext } from "react";
import * as Location from "expo-location";

type UserLocationContextType = {
  location: Location.LocationObject | null;
  setLocation: React.Dispatch<
    React.SetStateAction<Location.LocationObject | null>
  >;
};

export const UserLocationContext = createContext<UserLocationContextType>({
  location: null,
  setLocation: () => null,
});
