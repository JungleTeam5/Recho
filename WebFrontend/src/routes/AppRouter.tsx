import React from "react";
import {
  Routes,
  Route,
  Navigate,
  BrowserRouter as Router,
} from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import MainPage from "../pages/main/MainPage";
import ChatListPage from "../pages/chat/ChatListPage";
import ChatRoomPage from '../pages/chat/ChatRoomPage'; 
import UserPage from '../pages/user/UserPage'; 

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* 기본 경로를 로그인 페이지로 설정 */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/used-products" element={<UsedProductPage/>} />
        <Route path="/used-products/create" element={<CreateUsedProductPage/>} />
        <Route path="/used-products/:id" element={<UsedProductDetailPage />} /> 
        <Route path="/used-products/edit/:id" element={<UpdateUsedProductPage />} /> 
      </Routes>
    </Router>
  );
};

export default AppRouter;
