/* eslint-disable react-hooks/exhaustive-deps */
import { createContext } from "react";

import useHttp from "../../hooks/useHttp";

export const ReportsContext = createContext({
  onGetReports: (query, callback, errorCallBack, loader, notify) => null,
  onGetReport: (reportId, callback, errorCallBack, loader, notify) => null,
  onGetQuizReport: (query, quizId, callback, errorCallBack, loader, notify) =>
    null,
});

export const ReportsContextProvider = ({ children }) => {
  const { sendRequest } = useHttp();

  const baseUrl = "/";

  const onGetReports = async (
    query,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `report` + query,
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

  const onGetReport = async (
    reportId,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `report/${reportId}`,
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

  const onGetQuizReport = async (
    query,
    quizId,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `report/quiz/${quizId}` + query,
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

  return (
    <ReportsContext.Provider
      value={{
        onGetReports,
        onGetReport,
        onGetQuizReport,
      }}
    >
      {children}
    </ReportsContext.Provider>
  );
};
