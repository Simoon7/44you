import { ArrowLeft, Calendar, Users } from "lucide-react";
import { useState } from "react";

interface CompatibilityScreenProps {
  onBack: () => void;
}

export function CompatibilityScreen({
  onBack,
}: CompatibilityScreenProps) {
  const [showResult, setShowResult] = useState(false);

  const [myData, setMyData] = useState({
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    gender: "",
  });

  const [partnerData, setPartnerData] = useState({
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    gender: "",
  });

  // 연도 배열 생성 (2000년 ~ 2021년)
  const years = Array.from({ length: 22 }, (_, i) => 2000 + i);
  // 월 배열 생성 (1월 ~ 12월)
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  // 일 배열 생성 (1일 ~ 31일)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleStart = () => {
    // 모든 필드가 채워졌는지 확인
    if (
      !myData.birthYear ||
      !myData.birthMonth ||
      !myData.birthDay ||
      !myData.gender ||
      !partnerData.birthYear ||
      !partnerData.birthMonth ||
      !partnerData.birthDay ||
      !partnerData.gender
    ) {
      alert("모든 정보를 입력해주세요.");
      return;
    }

    // 여기에 궁합 보기 로직 추가 가능
    setShowResult(true);
  };

  const handleReset = () => {
    // 모든 입력 정보 초기화
    setMyData({
      birthYear: "",
      birthMonth: "",
      birthDay: "",
      gender: "",
    });
    setPartnerData({
      birthYear: "",
      birthMonth: "",
      birthDay: "",
      gender: "",
    });
    setShowResult(false);
  };

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
      {/* 모바일 앱 화면 영역 */}
      <div className="relative h-full w-full max-w-[700px] px-[10px]">
        <div className="relative h-full bg-[#F3F0FF] overflow-hidden border-x-2 border-gray-400 shadow-2xl">
          <div className="h-full overflow-y-auto py-8 px-4">
            <div className="flex flex-col items-center gap-8 w-full max-w-5xl mx-auto">
              {/* 헤더 */}
              <div className="w-full bg-white border-2 border-black text-black py-6 px-8 rounded-2xl shadow-lg flex items-center justify-between">
                <button
                  onClick={onBack}
                  className="p-2 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl">궁합 보기</h1>
                <div className="w-10"></div>{" "}
                {/* 균형을 위한 공간 */}
              </div>

              {/* 메인 콘텐츠 */}
              <div className="w-full bg-white rounded-3xl p-12 shadow-xl border-2 border-black min-h-[600px] flex flex-col items-center justify-center">
                {!showResult ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl w-full">
                      {/* 내 생년월일 */}
                      <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-black">
                        <h2 className="text-2xl text-black mb-6 text-center">
                          내 생년월일
                        </h2>

                        {/* 생년월일 */}
                        <div className="space-y-2 mb-4">
                          <label className="text-black text-sm">
                            생년월일
                          </label>
                          <div className="space-y-3">
                            <select
                              value={myData.birthYear}
                              onChange={(e) =>
                                setMyData({
                                  ...myData,
                                  birthYear: e.target.value,
                                })
                              }
                              className="w-full bg-white border-2 border-black rounded-xl px-4 py-4 outline-none focus:border-black transition-colors text-black"
                            >
                              <option value="">년도</option>
                              {years.map((year) => (
                                <option
                                  key={year}
                                  value={year}
                                >
                                  {year}
                                </option>
                              ))}
                            </select>
                            <select
                              value={myData.birthMonth}
                              onChange={(e) =>
                                setMyData({
                                  ...myData,
                                  birthMonth: e.target.value,
                                })
                              }
                              className="w-full bg-white border-2 border-black rounded-xl px-4 py-4 outline-none focus:border-black transition-colors text-black"
                            >
                              <option value="">월</option>
                              {months.map((month) => (
                                <option
                                  key={month}
                                  value={month}
                                >
                                  {month}
                                </option>
                              ))}
                            </select>
                            <select
                              value={myData.birthDay}
                              onChange={(e) =>
                                setMyData({
                                  ...myData,
                                  birthDay: e.target.value,
                                })
                              }
                              className="w-full bg-white border-2 border-black rounded-xl px-4 py-4 outline-none focus:border-black transition-colors text-black"
                            >
                              <option value="">일</option>
                              {days.map((day) => (
                                <option key={day} value={day}>
                                  {day}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* 성별 */}
                        <div className="space-y-2">
                          <label className="text-black text-sm">
                            성별
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setMyData({
                                  ...myData,
                                  gender:
                                    myData.gender === "남성"
                                      ? ""
                                      : "남성",
                                })
                              }
                              className={`py-3 rounded-xl transition-all text-center cursor-pointer border-2 border-black ${
                                myData.gender === "남성"
                                  ? "bg-[#F3F0FF] text-black"
                                  : "bg-white text-black"
                              }`}
                            >
                              남성
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setMyData({
                                  ...myData,
                                  gender:
                                    myData.gender === "여성"
                                      ? ""
                                      : "여성",
                                })
                              }
                              className={`py-3 rounded-xl transition-all text-center cursor-pointer border-2 border-black ${
                                myData.gender === "여성"
                                  ? "bg-[#F3F0FF] text-black"
                                  : "bg-white text-black"
                              }`}
                            >
                              여성
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 상대 생년월일 */}
                      <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-black">
                        <h2 className="text-2xl text-black mb-6 text-center">
                          상대 생년월일
                        </h2>

                        {/* 생년월일 */}
                        <div className="space-y-2 mb-4">
                          <label className="text-black text-sm">
                            생년월일
                          </label>
                          <div className="space-y-3">
                            <select
                              value={partnerData.birthYear}
                              onChange={(e) =>
                                setPartnerData({
                                  ...partnerData,
                                  birthYear: e.target.value,
                                })
                              }
                              className="w-full bg-white border-2 border-black rounded-xl px-4 py-4 outline-none focus:border-black transition-colors text-black"
                            >
                              <option value="">년도</option>
                              {years.map((year) => (
                                <option
                                  key={year}
                                  value={year}
                                >
                                  {year}
                                </option>
                              ))}
                            </select>
                            <select
                              value={partnerData.birthMonth}
                              onChange={(e) =>
                                setPartnerData({
                                  ...partnerData,
                                  birthMonth: e.target.value,
                                })
                              }
                              className="w-full bg-white border-2 border-black rounded-xl px-4 py-4 outline-none focus:border-black transition-colors text-black"
                            >
                              <option value="">월</option>
                              {months.map((month) => (
                                <option
                                  key={month}
                                  value={month}
                                >
                                  {month}
                                </option>
                              ))}
                            </select>
                            <select
                              value={partnerData.birthDay}
                              onChange={(e) =>
                                setPartnerData({
                                  ...partnerData,
                                  birthDay: e.target.value,
                                })
                              }
                              className="w-full bg-white border-2 border-black rounded-xl px-4 py-4 outline-none focus:border-black transition-colors text-black"
                            >
                              <option value="">일</option>
                              {days.map((day) => (
                                <option key={day} value={day}>
                                  {day}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* 성별 */}
                        <div className="space-y-2">
                          <label className="text-black text-sm">
                            성별
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setPartnerData({
                                  ...partnerData,
                                  gender:
                                    partnerData.gender ===
                                    "남성"
                                      ? ""
                                      : "남성",
                                })
                              }
                              className={`py-3 rounded-xl transition-all text-center cursor-pointer border-2 border-black ${
                                partnerData.gender === "남성"
                                  ? "bg-[#F3F0FF] text-black"
                                  : "bg-white text-black"
                              }`}
                            >
                              남성
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPartnerData({
                                  ...partnerData,
                                  gender:
                                    partnerData.gender ===
                                    "여성"
                                      ? ""
                                      : "여성",
                                })
                              }
                              className={`py-3 rounded-xl transition-all text-center cursor-pointer border-2 border-black ${
                                partnerData.gender === "여성"
                                  ? "bg-[#F3F0FF] text-black"
                                  : "bg-white text-black"
                              }`}
                            >
                              여성
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 시작 버튼 */}
                    <div className="flex justify-center mt-8">
                      <button
                        onClick={handleStart}
                        className="bg-[#7B4EBF] border-2 border-black text-white px-16 py-4 rounded-2xl transition-all shadow-lg cursor-pointer"
                      >
                        시작
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* 결과 박스 */}
                    <div className="bg-white rounded-2xl p-12 shadow-lg border-2 border-black min-h-[400px]">
                      <div className="flex justify-center mb-8">
                        <div className="border-2 border-black rounded-xl px-8 py-3">
                          <span className="text-black">
                            결과
                          </span>
                        </div>
                      </div>
                      {/* 여기에 결과 내용 추가 가능 */}
                    </div>

                    {/* 시작 버튼 */}
                    <div className="flex justify-center mt-8">
                      <button
                        onClick={handleReset}
                        className="bg-[#7B4EBF] text-white px-16 py-4 rounded-2xl transition-all shadow-lg cursor-pointer border-2 border-black"
                      >
                        다시하기
                      </button>
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