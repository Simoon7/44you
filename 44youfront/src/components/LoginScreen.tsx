import { useState } from "react";
import { Heart, Lock, User, ArrowLeft } from "lucide-react";

interface LoginScreenProps {
  onNavigateToSignup: () => void;
  onBack: () => void;
  onLoginSuccess: () => void;
}

export function LoginScreen({
  onNavigateToSignup,
  onBack,
  onLoginSuccess,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // 간단한 로그인 검증 (예시: 이메일과 비밀번호가 모두 입력되었는지 확인)
    if (email.trim() === "" || password.trim() === "") {
      alert("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    // 실제로는 서버 검증이 필요하지만, 여기서는 간단히 입력만 확인
    // 로그인 성공
    onLoginSuccess();
  };

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
      {/* 모바일 앱 화면 영역 */}
      <div className="relative h-full w-full max-w-[700px] px-[10px]">
        <div className="relative h-full bg-[#F3F0FF] overflow-hidden border-x-2 border-gray-400 shadow-2xl flex items-center justify-center">
          <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-4">
            {/* 헤더 */}
            <div className="text-center">
              <h1 className="text-5xl text-black">로그인</h1>
            </div>

            {/* 로그인 폼 */}
            <div className="w-full bg-white rounded-3xl p-8 shadow-xl border-2 border-black">
              <div className="space-y-6">
                {/* 이메일 입력 */}
                <div className="space-y-2">
                  <label className="text-black text-sm">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 outline-none focus:border-black transition-colors text-black"
                    placeholder="이메일을 입력하세요"
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleLogin()
                    }
                  />
                </div>

                {/* 비밀번호 입력 */}
                <div className="space-y-2">
                  <label className="text-black text-sm">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 outline-none focus:border-black transition-colors text-black"
                    placeholder="비밀번호를 입력하세요"
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleLogin()
                    }
                  />
                </div>

                {/* 로그인 버튼 */}
                <button
                  onClick={handleLogin}
                  className="w-full bg-[#7B4EBF] border-2 border-black text-white py-3 rounded-xl transition-all duration-300 text-center cursor-pointer"
                >
                  로그인
                </button>

                {/* 뒤로가기 버튼 */}
                <button
                  onClick={onBack}
                  className="w-full bg-white border-2 border-black text-black py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  뒤로가기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}