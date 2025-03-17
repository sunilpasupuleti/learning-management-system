import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { BatchesContextProvider } from "../../../services/Batches/Batches.context";
import { useEffect } from "react";
import { QuizContextProvider } from "../../../services/Quiz/Quiz.context";

const QuizHome = ({ title }) => {
  useEffect(() => {
    document.title = title;
  }, []);
  return (
    <BatchesContextProvider>
      <QuizContextProvider>
        <Outlet />
      </QuizContextProvider>
    </BatchesContextProvider>
  );
};

export default QuizHome;
