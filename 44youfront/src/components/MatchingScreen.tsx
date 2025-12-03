import { ArrowLeft, MessageCircle } from "lucide-react";
import "../styles/MatchingScreen.css";

interface MatchingScreenProps {
  onBack: () => void;
}

export function MatchingScreen({
  onBack,
}: MatchingScreenProps) {
  return (
    <div className="matching-container">
      <div className="matching-mobile-wrapper">
        <div className="matching-screen">
          <div className="matching-scroll-wrapper">
            <div className="matching-content">
              <div className="matching-header">
                <button onClick={onBack} className="matching-back-button">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="matching-title">매칭</h1>
                <div className="matching-spacer"></div>
              </div>

              <div className="matching-main">
                <div className="matching-grid">
                  <div className="matching-card-wrapper">
                    <div className="matching-card">
                      <h2 className="matching-card-title">상대방 1</h2>
                      <p className="matching-card-rate">매칭률</p>
                    </div>
                    <button className="matching-message-button">
                      <MessageCircle className="w-4 h-4" />
                      메세지 보내기
                    </button>
                  </div>

                  <div className="matching-card-wrapper">
                    <div className="matching-card">
                      <h2 className="matching-card-title">상대방 2</h2>
                      <p className="matching-card-rate">매칭률</p>
                    </div>
                    <button className="matching-message-button">
                      <MessageCircle className="w-4 h-4" />
                      메세지 보내기
                    </button>
                  </div>

                  <div className="matching-card-wrapper">
                    <div className="matching-card">
                      <h2 className="matching-card-title">상대방 3</h2>
                      <p className="matching-card-rate">매칭률</p>
                    </div>
                    <button className="matching-message-button">
                      <MessageCircle className="w-4 h-4" />
                      메세지 보내기
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
