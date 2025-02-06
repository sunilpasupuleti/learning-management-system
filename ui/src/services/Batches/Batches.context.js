/* eslint-disable react-hooks/exhaustive-deps */
import { createContext } from "react";

import useHttp from "../../hooks/useHttp";

export const BatchesContext = createContext({
  onCreateBatch: (data, callback, errorCallBack, loader, notify) => null,
  onEditBatch: (batchId, data, callback, errorCallBack, loader, notify) => null,
  onGetBatches: (query, callback, errorCallBack, loader, notify) => null,
  onGetBatchStudentsAndTrainers: (
    query,
    callback,
    errorCallBack,
    loader,
    notify
  ) => null,
  onUpdateBatchStudentAndTrainers: (query, callback, loader, notify) => null,
  onGetBatch: (batchId, callback, errorCallBack, loader, notify) => null,
  onDeleteBatch: (batchId, callback, errorCallBack, loader, notify) => null,
});

export const BatchesContextProvider = ({ children }) => {
  const { sendRequest } = useHttp();

  const baseUrl = "/";

  const onCreateBatch = async (
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `batch/`,
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

  const onEditBatch = async (
    batchId,
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `batch/` + batchId,
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

  const onUpdateBatchStudentAndTrainers = async (
    batchId,
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `batch/` + batchId + "/students-trainers",
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

  const onGetBatches = async (
    query,
    callback = () => null,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + "batch" + query,
      },
      {
        successCallback: callback,
        errorCallback: errorCallBack,
      },
      loader,
      notify
    );
  };

  const onGetBatchStudentsAndTrainers = async (
    query,
    callback = () => null,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `batch/students-trainers` + query,
      },
      {
        successCallback: callback,
        errorCallback: errorCallBack,
      },
      loader,
      notify
    );
  };

  const onGetBatch = async (
    batchId,
    callback = () => null,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + "batch/" + batchId,
      },
      {
        successCallback: callback,
        errorCallback: errorCallBack,
      },
      loader,
      notify
    );
  };

  const onDeleteBatch = async (
    batchId,
    callback = () => null,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + "batch/" + batchId,
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

  return (
    <BatchesContext.Provider
      value={{
        onCreateBatch,
        onDeleteBatch,
        onEditBatch,
        onGetBatch,
        onGetBatches,
        onGetBatchStudentsAndTrainers,
        onUpdateBatchStudentAndTrainers,
      }}
    >
      {children}
    </BatchesContext.Provider>
  );
};
