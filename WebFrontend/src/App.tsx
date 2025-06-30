import React from "react";
import AppRouter from "./routes/AppRouter";
import StyleGuideTest from './components/StyleGuideTest'; 
import "./App.css";
import "./index.css";

function App() {
  return (
    <div className="">
      <AppRouter />
      <StyleGuideTest />
    </div>
  );
}

export default App;
