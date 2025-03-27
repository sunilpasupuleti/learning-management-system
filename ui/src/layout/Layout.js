import { Route, Routes, useLocation } from "react-router-dom";
import { GetAuthGuard } from "./Guards";
import { SocketContextProvider } from "../services/Socket/Socket.context";
import { AuthenticationContextProvider } from "../services/Authentication/Authentication.context";

import PageNotFound from "../components/NotFound/PageNotFound";
import { AnimatePresence } from "framer-motion";
import Signin from "../components/Auth/Signin/Signin";
import Signup from "../components/Auth/Signup/Signup";
import Verify from "../components/Auth/Signup/Verify";
import ResetPassword from "../components/Auth/ResetPassword/ResetPassword";
import Dashboard from "../components/Admin/Dashboard";
import Batches from "../components/Admin/Batches/Batches";
import CreateEditBatch from "../components/Admin/Batches/CreateEditBatch";
import Users from "../components/Admin/Users/Users";
import UsersHome from "../components/Admin/Users/UsersHome";
import CreateEditUser from "../components/Admin/Users/CreateEditUser";
import BatchesHome from "../components/Admin/Batches/BatchesHome";
import Courses from "../components/Admin/Courses/Courses";
import { BatchesContextProvider } from "../services/Batches/Batches.context";
import { CourseContextProvider } from "../services/Courses/Courses.context";
import { ResourcesContextProvider } from "../services/Resources/Resources.context";
import Resources from "../components/Admin/Resources/Resources";
import QuizHome from "../components/Admin/Quiz/QuizHome";
import Quiz from "../components/Admin/Quiz/Quiz";
import CreateEditQuiz from "../components/Admin/Quiz/CreateEditQuiz";
import { ReportsContextProvider } from "../services/Reports/Reports.context";
import Reports from "../components/Admin/Reports/Reports";
import ReportView from "../components/Admin/Reports/ReportView";

const Layout = (props) => {
  const location = useLocation();

  const CoursesElement = ({ title }) => {
    return (
      <BatchesContextProvider>
        <CourseContextProvider>
          <Courses title={title} />
        </CourseContextProvider>
      </BatchesContextProvider>
    );
  };

  const ResourcesElement = ({ title }) => {
    return (
      <ResourcesContextProvider>
        <Resources title={title} />
      </ResourcesContextProvider>
    );
  };

  const ReportsElement = ({ title }) => {
    return (
      <ReportsContextProvider>
        <Reports title={title} />
      </ReportsContextProvider>
    );
  };

  const ReportViewElement = ({ title }) => {
    return (
      <ReportsContextProvider>
        <ReportView title={title} />
      </ReportsContextProvider>
    );
  };

  return (
    <SocketContextProvider>
      <AuthenticationContextProvider>
        <AnimatePresence mode="wait">
          <Routes key={location.pathname} location={location}>
            <Route path="/" element={<Signin title="Sign In" />} />

            <Route path="/auth">
              <Route path="signin" element={<Signin title="Sign In" />} />
              <Route path="signup" element={<Signup title="Sign Up" />} />
              <Route
                path="verify/:verificationToken"
                element={<Verify title="Verification" />}
              />
              <Route
                path="reset-password/:resetPasswordToken"
                element={<ResetPassword title="Reset Password" />}
              />
            </Route>

            <Route
              path="/dashboard"
              element={
                <GetAuthGuard
                  component={<Dashboard title="Dashboard" />}
                  to={"/auth/signin"}
                />
              }
            >
              <Route path="batches" element={<BatchesHome title="Batches" />}>
                <Route path="" element={<Batches title="Batches" />} />
                <Route
                  path="create"
                  element={<CreateEditBatch mode={"create"} />}
                />
                <Route
                  path="edit"
                  element={<CreateEditBatch mode={"edit"} />}
                />
              </Route>
              <Route
                path="courses"
                element={<CoursesElement title="Courses" />}
              />
              <Route
                path="resources"
                element={<ResourcesElement title="Resources" />}
              />

              <Route path="users" element={<UsersHome title="Users" />}>
                <Route path="" element={<Users title="Users" />} />
                <Route
                  path="create"
                  element={<CreateEditUser mode={"create"} />}
                />
                <Route path="edit" element={<CreateEditUser mode={"edit"} />} />
              </Route>
              <Route path="quiz" element={<QuizHome title="Quiz" />}>
                <Route path="" element={<Quiz title="Quiz" />} />
                <Route
                  path="create"
                  element={<CreateEditQuiz mode={"create"} />}
                />
                <Route path="edit" element={<CreateEditQuiz mode={"edit"} />} />
              </Route>
              <Route
                path="reports"
                element={<ReportsElement title="Reports" />}
              />

              <Route
                path="reports/view"
                element={<ReportViewElement title="View Report" />}
              />
            </Route>
            <Route path="*" element={<PageNotFound title="Page Not Found" />} />
          </Routes>
        </AnimatePresence>
      </AuthenticationContextProvider>
    </SocketContextProvider>
  );
};

export default Layout;
