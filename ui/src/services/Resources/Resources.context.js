/* eslint-disable react-hooks/exhaustive-deps */
import { createContext } from "react";

import useHttp from "../../hooks/useHttp";

export const ResourcesContext = createContext({
  onCreateResources: (data, callback, errorCallBack, loader, notify) => null,
  onEditResources: (data, callback, errorCallBack, loader, notify) => null,
  onGetResources: (callback, loader, notify) => null,
  onRemoveResources: (data, callback, errorCallBack, loader, notify) => null,
});

export const ResourcesContextProvider = ({ children }) => {
  const { sendRequest } = useHttp();

  const baseUrl = "/";

  const onCreateResources = async (
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `resource/`,
        type: "POST",
        data: data,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
      {
        successCallback: async (result) => {
          callback(result);
        },
        errorCallback: errorCallBack,
      },
      loader,
      notify
    );
  };

  const onEditResources = async (
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `resource/`,
        type: "PUT",
        data: data,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
      {
        successCallback: async (result) => {
          callback(result);
        },
        errorCallback: errorCallBack,
      },
      loader,
      notify
    );
  };

  const onRemoveResources = async (
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `resource/remove-resources`,
        type: "PUT",
        data: data,
      },
      {
        successCallback: async (result) => {
          callback(result);
        },
        errorCallback: errorCallBack,
      },
      loader,
      notify
    );
  };

  const onGetResources = async (
    callback = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + "resource",
      },
      {
        successCallback: callback,
      },
      loader,
      notify
    );
  };

  return (
    <ResourcesContext.Provider
      value={{
        onCreateResources,
        onEditResources,
        onRemoveResources,
        onGetResources,
      }}
    >
      {children}
    </ResourcesContext.Provider>
  );
};
