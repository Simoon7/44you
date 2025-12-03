import { Star, Heart, Globe } from "lucide-react";
import { useState } from "react";
import starIcon from "figma:asset/8977453a32a414a639679551037808df62246790.png";
import puzzleIcon from "figma:asset/8719def7b3238612e9d507ebff047c99b336092c.png";
import heartIcon from "figma:asset/fb1348383a4ad8853efc97d6ac3438b318929974.png";

interface OnboardingScreenProps {
  onComplete?: () => void;
}

export function OnboardingScreen({
  onComplete,
}: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: "image",
      title: "성향 보기",
      description: "사주로 나의 성향을 알아보세요",
    },
    {
      icon: "puzzle",
      title: "궁합 보기",
      description: "상대와의 궁합을 알아봅시다",
    },
    {
      icon: "heart",
      title: "자동 매칭",
      description:
        "궁합 점수를 토대로 운영의 상대를 찾아줍니다",
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
      {/* 모바일 앱 화면 영역 */}
      <div className="relative h-full w-full max-w-[700px] px-[10px]">
        <div
          className="relative h-full overflow-hidden border-x-2 border-gray-400 shadow-2xl"
          style={{
            background:
              "linear-gradient(135deg, #6B46C1 0%, #9F7AEA 50%, #B794F4 100%)",
          }}
        >
          {/* 상단 헤더 */}
          <div className="flex items-center justify-center px-2 py-1">
            <div className="flex items-center gap-2">
              <span className="text-white">FortuneForYou</span>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-b-2 border-white/30"></div>

          {/* 배경 별 장식들 */}
          <div className="absolute top-20 left-10 text-white opacity-40 text-xl pointer-events-none">
            ✦
          </div>
          <div className="absolute top-32 right-16 text-white opacity-30 text-sm pointer-events-none">
            ✦
          </div>
          <div className="absolute top-1/4 left-1/4 text-white opacity-20 text-base pointer-events-none">
            ✦
          </div>
          <div className="absolute bottom-1/3 right-1/4 text-white opacity-30 text-lg pointer-events-none">
            ✦
          </div>
          <div className="absolute bottom-20 right-12 text-white opacity-50 text-4xl pointer-events-none">
            ✦
          </div>
          <div className="absolute bottom-32 left-20 text-white opacity-25 text-sm pointer-events-none">
            ✦
          </div>

          {/* 메인 콘텐츠 */}
          <div className="flex flex-col items-center justify-center h-full px-8 py-12">
            <div className="flex-1 flex flex-col items-center justify-center gap-12">
              {/* 아이콘 영역 */}
              <div className="relative">
                {/* 아이콘 배경 원 */}
                <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl scale-150"></div>

                {/* 아이콘 */}
                <div className="relative backdrop-blur-sm rounded-full border-4 border-white/30 overflow-hidden w-48 h-48 bg-white">
                  {currentStep === 0 ? (
                    <div className="w-full h-full flex items-center justify-center p-8">
                      <img
                        src={starIcon}
                        alt="star"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : currentStep === 1 ? (
                    <div className="w-full h-full flex items-center justify-center p-8">
                      <img
                        src={puzzleIcon}
                        alt="puzzle"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-8">
                      <img
                        src={heartIcon}
                        alt="heart"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* 별 장식 추가 (첫 번째 단계일 때만) */}
                  {currentStep === 0 && (
                    <>
                      <div className="absolute -top-2 -left-2 text-white text-sm">
                        ✦
                      </div>
                      <div className="absolute -top-4 right-8 text-white text-xs">
                        ✦
                      </div>
                      <div className="absolute top-4 -right-4 text-white text-sm">
                        ✦
                      </div>
                      <div className="absolute -bottom-2 left-8 text-white text-xs">
                        ✦
                      </div>
                      <div className="absolute bottom-8 -right-2 text-white text-sm">
                        ✦
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 텍스트 영역 */}
              <div className="text-center space-y-4">
                <h2 className="text-white text-3xl">
                  {steps[currentStep].title}
                </h2>
                <p className="text-white/80 text-lg">
                  {steps[currentStep].description}
                </p>
              </div>
            </div>

            {/* 하단 진행 표시 및 버튼 */}
            <div className="w-full space-y-8">
              {/* 진행 표시기 */}
              <div className="flex items-center justify-center gap-4">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 border-2 border-white ${
                      index === currentStep
                        ? "w-24 bg-white"
                        : "w-16 bg-transparent"
                    }`}
                  />
                ))}
              </div>

              {/* 다음 버튼 */}
              <button
                onClick={handleNext}
                className={`w-full py-4 rounded-full transition-all shadow-lg cursor-pointer ${
                  currentStep < steps.length - 1
                    ? "bg-white text-[#7B4EBF]"
                    : "bg-white/30 text-white/50 cursor-not-allowed"
                }`}
                disabled={currentStep >= steps.length - 1}
              >
                다음
              </button>

              {/* 바로 시작하기 버튼 */}
              <button
                onClick={onComplete}
                className="w-full bg-white/20 text-white py-4 rounded-full transition-all shadow-lg cursor-pointer border-2 border-white"
              >
                바로 시작하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}