import { createContext, useContext } from "react";

export const MenuContext = createContext<{ openMenu: () => void }>({ openMenu: () => {} });
export const useMenu = () => useContext(MenuContext);
