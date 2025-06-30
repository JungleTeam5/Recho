// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // React Router 사용을 가정

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // 폼의 기본 제출 동작(새로고침) 방지
    setError(null); // 이전 에러 메시지 초기화

    try {
      // 1. NestJS 백엔드로 로그인 요청을 보냅니다.
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 2. HttpOnly 쿠키(refreshToken)를 주고받기 위해 'include' 옵션은 필수입니다.
        credentials: 'include', 
        body: JSON.stringify({ id, password }),
      });

      // 3. 응답 처리
      if (!response.ok) {
        // 서버에서 401 Unauthorized 같은 에러를 보냈을 경우
        const errorData = await response.json();
        throw new Error(errorData.message || '로그인에 실패했습니다.');
      }

      // 4. 성공적으로 응답을 받았을 경우
      const data = await response.json();
      const { accessToken } = data;

      // 5. 받은 accessToken을 localStorage에 저장합니다.
      // 실제 애플리케이션에서는 보안을 위해 메모리(상태 관리 라이브러리)에 저장하는 것이 더 좋습니다.
      localStorage.setItem('accessToken', accessToken);

      alert('로그인 성공!');
      navigate('/main'); // 로그인 성공 후 메인 페이지로 이동

    } catch (err) {
      if (err instanceof Error) {
        console.error('Login error:', err);
        setError(err.message);
      } else {
        setError('알 수 없는 에러가 발생했습니다.');
      }
    }
  };

  return (
    <div style={{ width: '300px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h1>로그인</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="id" style={{ display: 'block', marginBottom: '5px' }}>아이디</label>
          <input
            type="text"
            id="id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>비밀번호</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          로그인
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
