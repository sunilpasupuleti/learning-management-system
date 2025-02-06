/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useContext, useEffect, useState } from "react";
import { SocketContext } from "../Socket/Socket.context";
import {
  setLocalStorage,
  getLocalStorage,
  removeLocalStorage,
} from "../LocalStorage.service";
import useHttp from "../../hooks/useHttp";
import {
  adminRole,
  scrollToTop,
  superAdminRole,
  trainerRole,
} from "../../utility/helper";
import { useNavigate } from "react-router-dom";
import { useGoogleLogout } from "react-google-login";
import Swal from "sweetalert2";

export const AuthenticationContext = createContext({
  userData: null,
  loggedIn: false,
  onSignin: (data, callback, errorCallBack, loader, notify) => null,

  onGoogleSignin: (data, callback, errorCallBack, loader, notify) => null,
  onSignup: (data, callback, errorCallBack, loader, notify) => null,
  onVerify: (verificationToken, callback, errorCallBack, loader, notify) =>
    null,
  onResetPassword: (data, callback, errorCallBack, loader, notify) => null,
  onVerifyResetPassword: (
    resetPasswordToken,
    data,
    callback,
    errorCallBack,
    loader,
    notify
  ) => null,
  onResendVerificationLink: (data, callback, errorCallBack, loader, notify) =>
    null,
  onLogout: (callback) => null,
  onSetUserData: (data) => null,
  pageAccess: [],
});

const paths = {
  users: "/dashboard/users",
  usersCreate: "/dashboard/users/create",
  usersEdit: "/dashboard/users/edit",
  batches: "/dashboard/batches",
  batchesCreate: "/dashboard/batches/create",
  batchesEdit: "/dashboard/batches/edit",

  quiz: "/dashboard/quiz",
  quizCreate: "/dashboard/quiz/create",
  quizEdit: "/dashboard/quiz/edit",
  courses: "/dashboard/courses",
  resources: "/dashboard/resources",
  reports: "/dashboard/reports",
  reportView: "/dashboard/reports/view",
  studentQuiz: "/student/quiz",
  studentStartQuiz: "/student/quiz/start",
  studentReports: "/student/reports",
  studentReportView: "/student/reports/view",
  studentCourses: "/student/courses",
  studentCoursesView: "/student/courses/view",
  studentResources: "/student/resources",
  studentProfile: "/student/profile",
};

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

export const AuthenticationContextProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [pageAccess, setPageAccess] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const { sendRequest } = useHttp();
  const navigate = useNavigate();

  const baseUrl = "/";

  const { onFetchEvent, socket, onConnectSocket, onDisConnectSocket } =
    useContext(SocketContext);

  const onGoogleError = (e) => {
    console.log(e);
    Swal.fire("Google Authentication Failed", e?.error, "error");
  };

  const { signOut } = useGoogleLogout({
    clientId: GOOGLE_CLIENT_ID,
    onLogoutSuccess: () => {},
    onFailure: onGoogleError,
  });

  useEffect(() => {
    if (userData && pageAccess) {
      scrollToTop();
      let currentPath = window.location.pathname;
      let role = userData.role;

      if (!pageAccess.includes(currentPath)) {
        navigate("/auth/signin");
      }
      if (currentPath.includes("/auth")) {
        if ([superAdminRole, adminRole, trainerRole].includes(role)) {
          // navigate("/dashboard");
        } else {
          // navigate("/student");
        }
      }
    }
  }, [navigate, userData, pageAccess]);

  useEffect(() => {
    if (userData) {
      let role = userData.role;
      let pages = ["/contact"];
      let {
        users,
        usersCreate,
        usersEdit,
        batches,
        quiz,
        quizCreate,
        quizEdit,
        courses,
        studentQuiz,
        resources,
        studentStartQuiz,
        studentReportView,
        studentReports,
        batchesCreate,
        batchesEdit,
        reports,
        reportView,
        studentCourses,
        studentResources,
        studentCoursesView,
        studentProfile
      } = paths;
      if (role === superAdminRole) {
        pages.push(
          users,
          usersCreate,
          usersEdit,
          batches,
          batchesCreate,
          batchesEdit,
          quiz,
          quizCreate,
          quizEdit,
          courses,
          reports,
          reportView,
          resources,
          "/dashboard"
        );
      } else if (role === adminRole) {
        pages.push(
          users,
          usersCreate,
          usersEdit,
          resources,
          batches,
          batchesCreate,
          batchesEdit,
          quiz,
          quizCreate,
          quizEdit,
          courses,
          reports,
          reportView,
          "/dashboard"
        );
      } else if (role === trainerRole) {
        pages.push(reports, reportView, "/dashboard");
      } else {
        pages.push(
          studentQuiz,
          studentStartQuiz,
          studentReports,
          studentReportView,
          studentCourses,
          studentCoursesView,
          studentResources,
          studentProfile,
          "/student"
        );
      }
      setPageAccess(pages);
    }
  }, [userData]);

  useEffect(() => {
    (async () => {
      let loggedIn = getLocalStorage("loggedIn");
      if (loggedIn) {
        setLoggedIn(true);
        onGetSelfUser(
          async (result) => {
            if (!result.userData) {
              return;
            }
            onSetUserData(result.userData);
            await onConnectSocket(result.userData);
          },
          false,
          false
        );
      }
    })();
  }, []);

  useEffect(() => {
    if (socket) {
      const eventHandler = (data) => {
        onGetSelfUser(
          (result) => {
            onSetUserData(result.userData);
          },
          true,
          false
        );
      };
      onFetchEvent("refreshUserData", eventHandler);
      return () => {
        socket?.off("refreshUserData", eventHandler);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFetchEvent, socket]);

  const onSignInSuccess = async (userData) => {
    setLocalStorage("loggedIn", true);
    setLoggedIn(true);
    setUserData(userData);
    await onConnectSocket(userData);
  };

  const onSignin = async (
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `auth/signin`,
        type: "POST",
        data: data,
      },
      {
        successCallback: async (result) => {
          await onSignInSuccess(result.userData);
          callback(result);
        },
        errorCallback: errorCallBack,
      },
      loader,
      notify
    );
  };

  const onGoogleSignin = async (
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `auth/signin/google`,
        type: "POST",
        data: data,
      },
      {
        successCallback: async (result) => {
          console.log(result);
          await onSignInSuccess(result.userData);
          callback();
        },
        errorCallback: errorCallBack,
      },
      loader,
      notify
    );
  };

  const onSignup = async (
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `auth/signup`,
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

  const onVerify = async (
    verificationToken,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `auth/signup/verify/${verificationToken}`,
        type: "PUT",
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

  const onResetPassword = async (
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `auth/reset-password`,
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

  const onVerifyResetPassword = async (
    resetPasswordToken,
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `auth/reset-password/verify/${resetPasswordToken}`,
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

  const onResendVerificationLink = async (
    data,
    callback,
    errorCallBack = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + `auth/resend-verification-link`,
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

  const onSetUserData = (data) => {
    setUserData(data);
  };

  const onLogout = async (callback = () => {}) => {
    sendRequest(
      {
        url: baseUrl + `auth/signout`,
      },
      {
        successCallback: () => {
          removeLocalStorage("loggedIn");
          setUserData(null);
          setLoggedIn(false);
          onDisConnectSocket();
          signOut();
          callback();
        },
      },
      true,
      false
    );
  };

  const onGetSelfUser = async (
    callback = () => null,
    loader = true,
    notify = true
  ) => {
    sendRequest(
      {
        url: baseUrl + "auth",
      },
      {
        successCallback: callback,
      },
      loader,
      notify
    );
  };

  return (
    <AuthenticationContext.Provider
      value={{
        userData,
        loggedIn,
        onSignin,
        onSignup,
        onVerify,
        onResetPassword,
        onResendVerificationLink,
        onVerifyResetPassword,
        onLogout,
        onSetUserData,
        onGetSelfUser,
        onGoogleSignin,
        pageAccess,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
};
