import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// 동주님 미리 임포트 해 뒀어요.
import { loginAPI } from "../../services/authService";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // 이건 건드릴 필요 없습니다.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 동주님 여기서 로직 작성하면 됩니다.
    console.log("로그인 시도:", formData);

    try {
      // 여기에 실제 로그인 API 호출 로직 추가
      // await은 Promise 가 해결될 때 까지 기다림
      // loginAPI 함수가 Promise를 반환한다고 가정하고, 그 결과를 기다림

      //로직은 services/authService.ts 에 작성해주세요.

      // const response = await loginAPI(formData);

      // 임시로 성공으로 처리 -> 실제 API 응답으로 변경해주세요.
      const loginSuccess = true; // 또는 response.success

      if (loginSuccess) {
        navigate("/main");
      } else {
        alert("로그인 실패");
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      alert("로그인 실패");
    }
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

  return (
    <div>
      <h1>로그인</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">아이디:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="password">비밀번호:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">로그인</button>
      </form>
      <div>
        <button type="button" onClick={handleRegisterClick}>
          회원가입
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
