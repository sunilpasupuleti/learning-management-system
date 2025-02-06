/* eslint-disable react-hooks/exhaustive-deps */
import { createContext } from "react";

import useHttp from "../../hooks/useHttp";

export const UsersContext = createContext({
  onCreateUser: (data, callback, errorCallBack, loader, notify) => null,
  onCreateUsersFromCsv: (data, callback, errorCallBack, loader, notify) => null,
  onEditUser: (userId, data, callback, errorCallBack, loader, notify) => null,
  onGetUsers: (query, callback, loader, notify) => null,
  onGetUser: (userId, callback, errorCallBack, loader, notify) => null,
  onDeleteUser: (userId, callback, errorCallBack, loader, notify) => null,
  onUpdateUserData: (data, callback, errorCallBack, loader, notify) => null,
  onUpdatePassword: (data, callback, errorCallBack, loader, notify) => null,
});

export const UsersContextProvider = ({ children }) => {
  const { sendRequest } = useHttp();

  const baseUrl = "/";

  const onCreateUser = async (
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `user/`,
        type: "POST",
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

  const onCreateUsersFromCsv = async (
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `user/csv`,
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

  const onEditUser = async (
    userId,
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `user/` + userId,
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

  const onGetUsers = async (
    query = "",
    callback = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + "user" + query,
      },
      {
        successCallback: callback,
      },
      loader,
      notify
    );
  };

  const onGetUser = async (
    userId,
    callback = () => null,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + "user/" + userId,
      },
      {
        successCallback: callback,
        errorCallback: errorCallBack,
      },
      loader,
      notify
    );
  };

  const onDeleteUser = async (
    userId,
    callback = () => null,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + "user/" + userId,
        type: "DELETE",
      },
      {
        successCallback: callback,
        errorCallback: errorCallBack,
      },
      loader,
      notify
    );
  };

  const onUpdateUserData = async (
    data,
    callback = () => null,
    errorCallBack = () => null,
    loader = true,
    notify = true,
  ) => {
    sendRequest(
      {
        url: baseUrl + "user/updateUserdata",
        data,
        type: "POST",
      },
      {
        successCallback: callback,
        errorCallback: errorCallBack,
      },
      loader,
      notify,
    );
  };


  const onUpdatePassword = async (
    data,
    callback = () => null,
    errorCallBack = () => null,
    loader = true,
    notify = true,
  ) => {
    sendRequest(
      {
        url: baseUrl + "user/updatePassword",
        data,
        type: "POST",
      },
      {
        successCallback: callback,
        errorCallback: errorCallBack,
      },
      loader,
      notify,
    );
  };

  return (
    <UsersContext.Provider
      value={{
        onCreateUser,
        onDeleteUser,
        onEditUser,
        onGetUser,
        onGetUsers,
        onCreateUsersFromCsv,
        onUpdateUserData,
        onUpdatePassword
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};
