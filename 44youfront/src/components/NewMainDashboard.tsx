import heartIcon from "figma:asset/fb1348383a4ad8853efc97d6ac3438b318929974.png";
import starIcon from "figma:asset/8977453a32a414a639679551037808df62246790.png";
import chatIcon from "figma:asset/a6c0b2f3fc8bb49a0ae47b16074b7b4dc05f705e.png";
import bgImage from "figma:asset/474d6df0c85c70cae15082eadc7daf73f94a3819.png";
import { User, Users, Heart } from "lucide-react";

interface NewMainDashboardProps {
  onLogout?: () => void;
  onNavigateToPersonality?: () => void;
  onNavigateToCompatibility?: () => void;
  onNavigateToMatching?: () => void;
  onNavigateToCommunity?: () => void;
  onNavigateToChatRoom?: () => void;
}

export function NewMainDashboard({
  onLogout,
  onNavigateToPersonality,
  onNavigateToCompatibility,
  onNavigateToMatching,
  onNavigateToCommunity,
  onNavigateToChatRoom,
}: NewMainDashboardProps) {
  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      onLogout?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
      {/* 모바일 앱 화면 영역 */}
      <div className="relative h-full w-full max-w-[700px] px-[10px]">
        <div
          className="relative h-full overflow-hidden border-x-2 border-gray-400 shadow-2xl"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* 상단 헤더 */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2">
              <span className="text-white">FortuneForYou</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-1 bg-white text-[#7B4EBF] rounded-full cursor-pointer hover:bg-gray-100 transition-colors font-bold"
            >
              로그아웃
            </button>
          </div>

          {/* 구분선 */}
          <div className="border-b-2 border-white/30"></div>

          {/* 배경 장식 원들 */}
          <div className="absolute top-20 left-20 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-40 right-32 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* 별 장식들 */}
          <div className="absolute top-20 left-10 text-white opacity-60 text-xl pointer-events-none">
            ✦
          </div>
          <div className="absolute top-32 left-8 text-white opacity-40 text-sm pointer-events-none">
            ✦
          </div>
          <div className="absolute top-40 right-1/3 text-white opacity-50 text-base pointer-events-none">
            ✦
          </div>
          <div className="absolute top-1/3 right-20 text-white opacity-60 text-lg pointer-events-none">
            ✦
          </div>
          <div className="absolute bottom-1/3 left-1/4 text-white opacity-40 text-sm pointer-events-none">
            ✦
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex items-center justify-center h-[calc(100%-48px)] px-8 py-8">
            <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
              {/* 상단 3개 카드 */}
              <div className="flex items-center gap-4 w-full">
                {/* 성향 보기 카드 */}
                <button
                  onClick={onNavigateToPersonality}
                  className="flex-1 border-4 border-white/80 bg-[#F3F0FF] rounded-3xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors"
                >
                  <User
                    className="w-16 h-16 text-[#7B4EBF] pointer-events-none"
                    strokeWidth={2}
                  />
                  <span className="text-black pointer-events-none font-bold">
                    내 성향 보기
                  </span>
                </button>

                {/* 궁합 보기 카드 */}
                <button
                  onClick={onNavigateToCompatibility}
                  className="flex-1 border-4 border-white/80 bg-[#F3F0FF] rounded-3xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors"
                >
                  <Users
                    className="w-16 h-16 text-[#7B4EBF] pointer-events-none"
                    strokeWidth={2}
                  />
                  <span className="text-black pointer-events-none font-bold">
                    궁합 보기
                  </span>
                </button>

                {/* 매칭 카드 */}
                <button
                  onClick={onNavigateToMatching}
                  className="flex-1 border-4 border-white/80 bg-white rounded-3xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors"
                >
                  <Heart
                    className="w-16 h-16 text-[#7B4EBF] pointer-events-none"
                    strokeWidth={2}
                  />
                  <span className="text-black pointer-events-none font-bold">
                    매칭
                  </span>
                </button>
              </div>

              {/* 커뮤니티와 채팅방 버튼 */}
              <div className="flex items-center gap-4 w-full">
                {/* 커뮤니티 버튼 */}
                <button
                  onClick={onNavigateToCommunity}
                  className="flex-1 border-4 border-white/80 bg-white rounded-3xl p-8 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <span className="text-black pointer-events-none font-bold">
                    커뮤니티
                  </span>
                </button>

                {/* 채팅방 버튼 */}
                <button
                  onClick={onNavigateToChatRoom}
                  className="flex-1 border-4 border-white/80 bg-white rounded-3xl p-8 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <span className="text-black pointer-events-none font-bold">
                    채팅방
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}