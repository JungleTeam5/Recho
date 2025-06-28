import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    verificationCode: "",
  });

  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendVerificationCode = () => {
    if (!formData.email) {
      alert("이메일을 입력해주세요.");
      return;
    }
    console.log("인증번호 전송:", formData.email);
    setIsEmailSent(true);
    // 이메일 인증번호 전송 로직 추가
  };

  const handleVerifyEmail = () => {
    if (!formData.verificationCode) {
      alert("인증번호를 입력해주세요.");
      return;
    }
    console.log("이메일 인증 시도:", formData.verificationCode);
    setIsEmailVerified(true);
    // 여기에 인증번호 확인 로직 추가
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailVerified) {
      alert("이메일 인증을 완료해주세요.");
      return;
    }
    console.log("회원가입 시도:", formData);

    // 회원가입 성공 시 로그인 페이지로 이동
    alert("회원가입이 완료되었습니다.");
    navigate("/login");
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div>
      <h1>회원가입</h1>
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
          <label htmlFor="email">이메일:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            onClick={handleSendVerificationCode}
            disabled={isEmailSent}
          >
            {isEmailSent ? "인증번호 전송됨" : "인증번호 전송"}
          </button>
        </div>
        {isEmailSent && (
          <div>
            <label htmlFor="verificationCode">인증번호:</label>
            <input
              type="text"
              id="verificationCode"
              name="verificationCode"
              value={formData.verificationCode}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={handleVerifyEmail}
              disabled={isEmailVerified}
            >
              {isEmailVerified ? "인증 완료" : "인증 확인"}
            </button>
          </div>
        )}
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
        <div>
          <label htmlFor="confirmPassword">비밀번호 확인:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" disabled={!isEmailVerified}>
          회원가입
        </button>
      </form>
      <div>
        <button type="button" onClick={handleBackToLogin}>
          로그인으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default RegisterPage;
