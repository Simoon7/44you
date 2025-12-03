import { ArrowLeft, RotateCcw } from "lucide-react";
import { useState } from "react";

interface PersonalityScreenProps {
  onBack: () => void;
}

export function PersonalityScreen({
  onBack,
}: PersonalityScreenProps) {
  const [showPersonality, setShowPersonality] = useState(false);

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
      {/* 모바일 앱 화면 영역 */}
      <div className="relative h-full w-full max-w-[700px] px-[10px]">
        <div className="relative h-full bg-[#F3F0FF] overflow-hidden border-x-2 border-gray-400 shadow-2xl">
          <div className="h-full overflow-y-auto py-8 px-4">
            <div className="flex flex-col items-center gap-8 w-full max-w-3xl mx-auto">
              {/* 헤더 */}
              <div className="w-full bg-white border-2 border-black text-black py-6 px-8 rounded-2xl shadow-lg flex items-center justify-between">
                <button
                  onClick={onBack}
                  className="p-2 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl">성향 보기</h1>
                <div className="w-10"></div>{" "}
                {/* 균형을 위한 공간 */}
              </div>

              {/* 메인 콘텐츠 */}
              <div className="w-full bg-white rounded-3xl p-16 shadow-xl border-2 border-black flex flex-col items-center justify-center gap-12 min-h-[400px] relative">
                {!showPersonality ? (
                  <>
                    {/* 버튼 */}
                    <button
                      onClick={() => setShowPersonality(true)}
                      className="bg-[#F3F0FF] border-2 border-black text-black px-20 py-8 rounded-2xl shadow-lg transition-all duration-300 text-2xl cursor-pointer"
                    >
                      내 성향 알아보기
                    </button>
                  </>
                ) : (
                  <>
                    {/* 되돌리기 버튼 */}
                    <button
                      onClick={() => setShowPersonality(false)}
                      className="absolute top-6 right-6 p-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-6 h-6 text-black" />
                    </button>

                    <div className="w-full flex flex-col items-center gap-8">
                      {/* 나의 성향 타이틀 박스 */}
                      <div className="bg-white border-2 border-black rounded-xl px-12 py-4 -mt-8">
                        <span className="text-black text-2xl">
                          나의 성향
                        </span>
                      </div>

                      {/* 16개의 박스 그리드 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((num) => (
                          <div
                            key={num}
                            className="bg-white border-2 border-black rounded-xl p-6 flex items-center justify-center transition-colors"
                          >
                            <span className="text-black text-xl">
                              {num}번
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}