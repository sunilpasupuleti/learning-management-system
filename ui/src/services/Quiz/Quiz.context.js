/* eslint-disable react-hooks/exhaustive-deps */
import { createContext } from "react";

import useHttp from "../../hooks/useHttp";

export const QuizContext = createContext({
  onCreateQuiz: (data, callback, errorCallBack, loader, notify) => null,
  onEditQuiz: (quizId, data, callback, errorCallBack, loader, notify) => null,
  onSubmitQuiz: (quizId, data, callback, errorCallBack, loader, notify) => null,
  onGetQuizes: (query, callback, loader, notify) => null,
  onGetQuiz: (quizId, callback, errorCallBack, loader, notify) => null,
  onDeleteQuiz: (quizId, callback, errorCallBack, loader, notify) => null,
});

export const QuizContextProvider = ({ children }) => {
  const { sendRequest } = useHttp();

  const baseUrl = "/";

  const onCreateQuiz = async (
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `quiz/`,
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

  const onSubmitQuiz = async (
    quizId,
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `quiz/submit/${quizId}`,
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

  const onEditQuiz = async (
    quizId,
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `quiz/` + quizId,
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

  const onGetQuizes = async (
    query,
    callback = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + "quiz" + query,
      },
      {
        successCallback: callback,
      },
      loader,
      notify
    );
  };

  const onGetQuiz = async (
    quizId,
    callback = () => null,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + "quiz/" + quizId,
      },
      {
        successCallback: callback,
        errorCallback: errorCallBack,
      },
      loader,
      notify
    );
  };

  const onDeleteQuiz = async (
    quizId,
    callback = () => null,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + "quiz/" + quizId,
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
    <QuizContext.Provider
      value={{
        onCreateQuiz,
        onDeleteQuiz,
        onEditQuiz,
        onGetQuiz,
        onGetQuizes,
        onSubmitQuiz,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};
