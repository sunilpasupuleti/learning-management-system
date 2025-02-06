/* eslint-disable react-hooks/exhaustive-deps */
import { createContext } from "react";
import useHttp from "../../hooks/useHttp";

export const HelperContext = createContext({});

export const HelperContextProvider = ({ children }) => {
  const { sendRequest } = useHttp();

  const baseUrl = "/";

  return <HelperContext.Provider value={{}}>{children}</HelperContext.Provider>;
};
