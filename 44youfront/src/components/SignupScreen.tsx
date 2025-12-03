import { useState } from "react";
import {
  Heart,
  User,
  Lock,
  Calendar,
  Users,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

interface SignupScreenProps {
  onBack: () => void;
}

export function SignupScreen({ onBack }: SignupScreenProps) {
  const [formData, setFormData] = useState({
    id: "",
    password: "",
    passwordConfirm: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    gender: "",
    name: "",
  });

  const handleSubmit = () => {
    // 모든 필드가 채워졌는지 확인
    if (
      !formData.id ||
      !formData.password ||
      !formData.passwordConfirm ||
      !formData.birthYear ||
      !formData.birthMonth ||
      !formData.birthDay ||
      !formData.gender ||
      !formData.name
    ) {
      alert("모든 정보를 기입해주세요.");
      return;
    }

    // 비밀번호 일치 여부 확인
    if (formData.password !== formData.passwordConfirm) {
      alert("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    // 회원가입 로직
    alert(
      "회원가입이 완료되었습니다!\n운명의 인연을 찾아보세요!",
    );
    onBack();
  };

  // 연도 배열 생성 (2000년 ~ 2021년)
  const years = Array.from({ length: 22 }, (_, i) => 2000 + i);
  // 월 배열 생성 (1월 ~ 12월)
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  // 일 배열 생성 (1일 ~ 31일)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
      {/* 모바일 앱 화면 영역 */}
      <div className="relative h-full w-full max-w-[700px] px-[10px]">
        <div className="relative h-full bg-[#F3F0FF] overflow-hidden border-x-2 border-gray-400 shadow-2xl">
          <div className="h-full overflow-y-auto py-8">
            <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto px-4">
              {/* 헤더 */}
              <div className="text-center space-y-2">
                <h1 className="text-5xl text-black">
                  회원가입
                </h1>
              </div>

              {/* 회원가입 폼 */}
              <div className="w-full bg-white rounded-3xl p-8 shadow-xl border-2 border-black">
                <div className="space-y-4">
                  {/* 이름 */}
                  <div className="space-y-2">
                    <label className="text-black text-sm">
                      이름
                    </label>
                    <input
                      type="text"
                      placeholder="이름을 입력하세요"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          name: e.target.value,
                        })
                      }
                      className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 outline-none focus:border-black transition-colors text-black"
                    />
                  </div>

                  {/* 아이디 */}
                  <div className="space-y-2">
                    <label className="text-black text-sm">
                      아이디
                    </label>
                    <input
                      type="text"
                      placeholder="이메일을 입력하세요"
                      value={formData.id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          id: e.target.value,
                        })
                      }
                      className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 outline-none focus:border-black transition-colors text-black"
                    />
                  </div>

                  {/* 비밀번호 */}
                  <div className="space-y-2">
                    <label className="text-black text-sm">
                      비밀번호
                    </label>
                    <input
                      type="password"
                      placeholder="비밀번호를 입력하세요"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          password: e.target.value,
                        })
                      }
                      className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 outline-none focus:border-black transition-colors text-black"
                    />
                  </div>

                  {/* 비밀번호 확인 */}
                  <div className="space-y-2">
                    <label className="text-black text-sm">
                      비밀번호 확인
                    </label>
                    <input
                      type="password"
                      placeholder="비밀번호를 다시 입력하세요"
                      value={formData.passwordConfirm}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          passwordConfirm: e.target.value,
                        })
                      }
                      className="w-full bg-white border-2 border-black rounded-xl px-4 py-3 outline-none focus:border-black transition-colors text-black"
                    />
                  </div>

                  {/* 생년월일 */}
                  <div className="space-y-2">
                    <label className="text-black text-sm">
                      생년월일
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={formData.birthYear}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            birthYear: e.target.value,
                          })
                        }
                        className="w-full bg-white border-2 border-black rounded-xl px-3 py-3 outline-none focus:border-black transition-colors text-black"
                      >
                        <option value="">년</option>
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}년
                          </option>
                        ))}
                      </select>
                      <select
                        value={formData.birthMonth}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            birthMonth: e.target.value,
                          })
                        }
                        className="w-full bg-white border-2 border-black rounded-xl px-3 py-3 outline-none focus:border-black transition-colors text-black"
                      >
                        <option value="">월</option>
                        {months.map((month) => (
                          <option key={month} value={month}>
                            {month}월
                          </option>
                        ))}
                      </select>
                      <select
                        value={formData.birthDay}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            birthDay: e.target.value,
                          })
                        }
                        className="w-full bg-white border-2 border-black rounded-xl px-3 py-3 outline-none focus:border-black transition-colors text-black"
                      >
                        <option value="">일</option>
                        {days.map((day) => (
                          <option key={day} value={day}>
                            {day}일
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
                          setFormData({
                            ...formData,
                            gender:
                              formData.gender === "남성"
                                ? ""
                                : "남성",
                          })
                        }
                        className={`py-3 rounded-xl transition-all text-center cursor-pointer border-2 border-black ${
                          formData.gender === "남성"
                            ? "bg-[#F3F0FF] text-black"
                            : "bg-white text-black"
                        }`}
                      >
                        남성
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            gender:
                              formData.gender === "여성"
                                ? ""
                                : "여성",
                          })
                        }
                        className={`py-3 rounded-xl transition-all text-center cursor-pointer border-2 border-black ${
                          formData.gender === "여성"
                            ? "bg-[#F3F0FF] text-black"
                            : "bg-white text-black"
                        }`}
                      >
                        여성
                      </button>
                    </div>
                  </div>

                  {/* 버튼 영역 */}
                  <div className="flex flex-col gap-3 mt-6">
                    <button
                      onClick={handleSubmit}
                      className="w-full bg-[#7B4EBF] text-white py-3 rounded-xl transition-all duration-300 text-center cursor-pointer border-2 border-black"
                    >
                      가입하기
                    </button>
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
      </div>
    </div>
  );
}