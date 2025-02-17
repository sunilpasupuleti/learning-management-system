/* eslint-disable react-hooks/exhaustive-deps */
import { createContext } from "react";

import useHttp from "../../hooks/useHttp";

export const CourseContext = createContext({
  onCreateCourse: (data, callback, errorCallBack, loader, notify) => null,
  onEditCourse: (courseId, data, callback, errorCallBack, loader, notify) =>
    null,
  onGetCourses: (callback, loader, notify) => null,
  onGetCourse: (courseId, callback, errorCallBack, loader, notify) => null,
  onDeleteCourse: (courseId, callback, errorCallBack, loader, notify) => null,

  onRemoveCourseSection: (
    courseId,
    data,
    callback,
    errorCallBack,
    loader,
    notify
  ) => null,
  onRemoveCourseVideos: (
    courseId,
    data,
    callback,
    errorCallBack,
    loader,
    notify
  ) => null,
  onRemoveCourseResources: (
    courseId,
    data,
    callback,
    errorCallBack,
    loader,
    notify
  ) => null,
});

export const CourseContextProvider = ({ children }) => {
  const { sendRequest } = useHttp();

  const baseUrl = "/";

  const onCreateCourse = async (
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `course/`,
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

  const onEditCourse = async (
    courseId,
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `course/` + courseId,
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

  const onRemoveCourseSection = async (
    courseId,
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `course/` + courseId + "/remove-section",
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

  const onRemoveCourseVideos = async (
    courseId,
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `course/` + courseId + "/remove-videos",
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

  const onGetCourses = async (
    callback = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + "course",
      },
      {
        successCallback: callback,
      },
      loader,
      notify
    );
  };

  const onGetCourse = async (
    courseId,
    callback = () => null,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + "course/" + courseId,
      },
      {
        successCallback: callback,
        errorCallback: errorCallBack,
      },
      loader,
      notify
    );
  };

  const onDeleteCourse = async (
    courseId,
    callback = () => null,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + "course/" + courseId,
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

  const onRemoveCourseResources = async (
    courseId,
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `course/` + courseId + "/remove-resources",
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

  return (
    <CourseContext.Provider
      value={{
        onCreateCourse,
        onDeleteCourse,
        onEditCourse,
        onGetCourse,
        onRemoveCourseVideos,
        onGetCourses,
        onRemoveCourseSection,
        onRemoveCourseResources,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};
