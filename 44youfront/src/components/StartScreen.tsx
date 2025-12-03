import { Bell } from "lucide-react";
import logoIcon from "figma:asset/d5547835e7ec586e20f5315b1b75135356551177.png";

interface StartScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToSignup?: () => void;
}

export function StartScreen({
  onNavigateToLogin,
  onNavigateToSignup,
}: StartScreenProps) {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
      {/* 모바일 앱 화면 영역 */}
      <div className="relative h-full w-full max-w-[700px] px-[10px]">
        <div className="relative h-full bg-[#F3F0FF] overflow-hidden border-x-2 border-gray-400 shadow-2xl">
          {/* 상단 헤더 */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2">
              <span className="text-[#B8A7FF]">
                FortuneForYou
              </span>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div className="flex items-center justify-around px-6 py-1 border-b-2 border-gray-200"></div>

          {/* 메인 콘텐츠 */}
          <div className="flex flex-col items-center justify-center px-6 h-[calc(100%-64px)]">
            {/* 메인 타이틀 */}
            <div className="flex items-center gap-4 mb-2">
              <div className="text-center">
                <h1 className="text-4xl mb-2">운명적인</h1>
                <h1 className="text-4xl">만남의 시작</h1>
              </div>
            </div>

            {/* 서브 텍스트 */}
            <p className="text-gray-500 mb-8">
              포포유에서 운명의 짝을 찾아보세요!
            </p>

            {/* 가입하기 버튼 */}
            <button
              onClick={onNavigateToSignup}
              className="w-full max-w-sm bg-[#7B4EBF] text-white py-4 rounded-full text-lg mb-4 cursor-pointer hover:bg-[#6B45B5] transition-colors"
            >
              가입하기
            </button>

            {/* 로그인 링크 */}
            <p className="text-gray-500 mb-12">
              이미 계정이 있다면?{" "}
              <button
                onClick={onNavigateToLogin}
                className="text-[#7B4EBF] underline cursor-pointer"
              >
                로그인하기
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}