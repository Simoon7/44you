import { ArrowLeft, Search, Edit3, MessageCircle, Eye } from 'lucide-react';
import { useState } from 'react';

interface CommunityScreenProps {
  onBack: () => void;
}

interface Post {
  id: number;
  title: string;
  author: string;
  date: string;
  views: number;
  comments: number;
}

const mockPosts: Post[] = [
  { id: 1, title: '첫 만남에서 좋은 인상 남기는 방법', author: '연애고수', date: '2025-11-15', views: 89, comments: 12 },
];

export function CommunityScreen({ onBack }: CommunityScreenProps) {
  const [isWriting, setIsWriting] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [commentText, setCommentText] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    alert('게시글이 등록되었습니다!');
    setTitle('');
    setContent('');
    setIsWriting(false);
  };

  const handleCancel = () => {
    if (title.trim() || content.trim()) {
      if (window.confirm('작성 중인 내용이 있습니다. 취소하시겠습니까?')) {
        setTitle('');
        setContent('');
        setIsWriting(false);
      }
    } else {
      setIsWriting(false);
    }
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
  };

  const handleCommentSubmit = () => {
    if (!commentText.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }
    alert('댓글이 등록되었습니다!');
    setCommentText('');
  };

  // 글쓰기 화면
  if (isWriting) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
        {/* 모바일 앱 화면 영역 */}
        <div className="relative h-full w-full max-w-[700px] px-[10px]">
          <div className="relative h-full bg-[#F3F0FF] overflow-hidden border-x-2 border-gray-400 shadow-2xl">
            <div className="h-full overflow-y-auto py-8 px-4">
              <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto">
                {/* 헤더 */}
                <div className="w-full bg-white border-2 border-black text-black py-6 px-8 rounded-2xl shadow-lg flex items-center justify-between">
                  <button
                    onClick={handleCancel}
                    className="p-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h1 className="text-3xl">글쓰기</h1>
                  <div className="w-10"></div>
                </div>

                {/* 글쓰기 폼 */}
                <div className="w-full bg-white rounded-2xl shadow-lg border-2 border-black p-8">
                  <div className="space-y-6">
                    {/* 제목 입력 */}
                    <div className="space-y-2">
                      <label className="text-black">제목</label>
                      <input
                        type="text"
                        placeholder="제목을 입력하세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-white border-2 border-black rounded-lg px-4 py-3 outline-none focus:border-black transition-colors text-black"
                      />
                    </div>

                    {/* 내용 입력 */}
                    <div className="space-y-2">
                      <label className="text-black">내용</label>
                      <textarea
                        placeholder="내용을 입력하세요"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={15}
                        className="w-full bg-white border-2 border-black rounded-lg px-4 py-3 outline-none focus:border-black transition-colors text-black resize-none"
                      />
                    </div>

                    {/* 버튼 영역 */}
                    <div className="flex gap-4 justify-end">
                      <button
                        onClick={handleCancel}
                        className="bg-white border-2 border-black text-black px-8 py-3 rounded-lg transition-all cursor-pointer"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="bg-black text-white px-8 py-3 rounded-lg transition-all cursor-pointer"
                      >
                        등록
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

  // 게시글 상세보기 화면
  if (selectedPost) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
        {/* 모바일 앱 화면 영역 */}
        <div className="relative h-full w-full max-w-[700px] px-[10px]">
          <div className="relative h-full bg-[#F3F0FF] overflow-hidden border-x-2 border-gray-400 shadow-2xl">
            <div className="h-full overflow-y-auto py-8 px-4">
              <div className="flex flex-col items-center gap-8 w-full max-w-6xl mx-auto">
                {/* 헤더 */}
                <div className="w-full bg-white border-2 border-black text-black py-6 px-8 rounded-2xl shadow-lg flex items-center justify-between">
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="p-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h1 className="text-3xl">커뮤니티</h1>
                  <div className="w-10"></div>
                </div>

                {/* 게시글 내용 */}
                <div className="w-full bg-white rounded-2xl shadow-lg border-2 border-black overflow-hidden">
                  {/* 게시글 제목 */}
                  <div className="bg-white border-b-2 border-black p-6">
                    <h2 className="text-2xl text-black">{selectedPost.title}</h2>
                  </div>

                  {/* 내용 */}
                  <div className="bg-white p-8 min-h-[300px]">
                    <div className="text-black space-y-4">
                      <p>안녕하세요! 첫 만남에서 좋은 인상을 남기는 방법에 대해 공유하고자 합니다.</p>
                      
                      <p className="pt-4"><strong>1. 시간 약속을 꼭 지키세요</strong></p>
                      <p>첫 인상에서 가장 중요한 것은 시간 약속입니다. 최소 5-10분 일찍 도착하는 것이 좋습니다.</p>
                      
                      <p className="pt-4"><strong>2. 깔끔한 복장</strong></p>
                      <p>너무 화려하거나 캐주얼하지 않은, 깔끔한 복장이 좋습니다. TPO에 맞는 옷차림을 선택하세요.</p>
                      
                      <p className="pt-4"><strong>3. 미소와 눈 맞춤</strong></p>
                      <p>자연스러운 미소와 적절한 눈 맞춤은 상대방에게 호감을 줍니다.</p>
                      
                      <p className="pt-4"><strong>4. 경청하는 자세</strong></p>
                      <p>상대방의 이야기에 진심으로 귀 기울이고, 적절한 리액션을 보여주세요.</p>
                      
                      <p className="pt-4">이런 작은 것들이 모여 좋은 첫 인상을 만들 수 있습니다. 여러분의 경험도 공유해주세요!</p>
                    </div>
                  </div>

                  {/* 댓글 영역 */}
                  <div className="bg-white border-t-2 border-black p-8">
                    <h3 className="text-xl text-black mb-4">댓글</h3>
                    
                    {/* 기존 댓글 목록 */}
                    <div className="space-y-4 mb-6">
                      <div className="bg-white border-2 border-black rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-black">행복한하루</span>
                          <span className="text-gray-500 text-sm">2025-11-15 14:23</span>
                        </div>
                        <p className="text-black">정말 유익한 정보네요! 특히 시간 약속 지키기가 중요한 것 같아요.</p>
                      </div>
                      
                      <div className="bg-white border-2 border-black rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-black">설레는마음</span>
                          <span className="text-gray-500 text-sm">2025-11-15 15:10</span>
                        </div>
                        <p className="text-black">다음 주에 첫 만남이 있는데 도움이 많이 됐습니다. 감사합니다!</p>
                      </div>
                      
                      <div className="bg-white border-2 border-black rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-black">좋은인연</span>
                          <span className="text-gray-500 text-sm">2025-11-15 16:45</span>
                        </div>
                        <p className="text-black">경청하는 자세가 정말 중요하더라구요. 좋은 팁 감사합니다!</p>
                      </div>
                    </div>

                    {/* 댓글 입력 */}
                    <div className="space-y-2">
                      <textarea
                        placeholder="댓글을 입력하세요"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={4}
                        className="w-full bg-white border-2 border-black rounded-lg px-4 py-3 outline-none focus:border-black transition-colors text-black resize-none"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={handleCommentSubmit}
                          className="bg-black text-white px-8 py-3 rounded-lg transition-all cursor-pointer"
                        >
                          댓글 등록
                        </button>
                      </div>
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

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center overflow-hidden">
      {/* 모바일 앱 화면 영역 */}
      <div className="relative h-full w-full max-w-[700px] px-[10px]">
        <div className="relative h-full bg-[#F3F0FF] overflow-hidden border-x-2 border-gray-400 shadow-2xl">
          <div className="h-full overflow-y-auto py-8 px-4">
            <div className="flex flex-col items-center gap-8 w-full max-w-6xl mx-auto">
              {/* 헤더 */}
              <div className="w-full bg-white border-2 border-black text-black py-6 px-8 rounded-2xl shadow-lg flex items-center justify-between">
                <button
                  onClick={onBack}
                  className="p-2 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl">커뮤니티</h1>
                <div className="w-10"></div>
              </div>

              {/* 검색 & 글쓰기 영역 */}
              <div className="w-full flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md w-full">
                  <input
                    type="text"
                    placeholder="게시글 검색..."
                    className="w-full pl-4 pr-12 py-3 rounded-lg border-2 border-black focus:border-black focus:outline-none bg-white text-black"
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded transition-colors cursor-pointer">
                    <Search className="w-5 h-5 text-black" />
                  </button>
                </div>
                <button 
                  onClick={() => setIsWriting(true)}
                  className="bg-[#F3F0FF] text-black px-6 py-3 rounded-lg shadow-md transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer border-2 border-black"
                >
                  <Edit3 className="w-5 h-5" />
                  글쓰기
                </button>
              </div>

              {/* 게시판 테이블 */}
              <div className="w-full bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-black">
                {/* 테이블 헤더 */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 bg-white p-4 border-b-2 border-black">
                  <div className="col-span-6 text-black">제목</div>
                  <div className="col-span-2 text-center text-black">작성자</div>
                  <div className="col-span-2 text-center text-black">작성일</div>
                  <div className="col-span-1 text-center text-black">조회</div>
                  <div className="col-span-1 text-center text-black">댓글</div>
                </div>

                {/* 게시글 목록 */}
                <div className="divide-y divide-black">
                  {mockPosts.map((post) => (
                    <div
                      key={post.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 transition-colors cursor-pointer"
                      onClick={() => handlePostClick(post)}
                    >
                      <div className="md:col-span-6">
                        <div className="flex items-center gap-2">
                          <span className="text-black transition-colors">
                            {post.title}
                          </span>
                          <span className="text-black text-sm flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments}
                          </span>
                        </div>
                      </div>
                      <div className="md:col-span-2 text-black text-sm md:text-center">
                        {post.author}
                      </div>
                      <div className="md:col-span-2 text-black text-sm md:text-center">
                        {post.date}
                      </div>
                      <div className="md:col-span-1 text-black text-sm md:text-center flex items-center gap-1 md:justify-center">
                        <Eye className="w-4 h-4" />
                        {post.views}
                      </div>
                      <div className="md:col-span-1 text-black text-sm md:text-center hidden md:flex md:items-center md:justify-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {post.comments}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 페이지네이션 */}
                <div className="flex items-center justify-center gap-2 p-6 border-t-2 border-black">
                  <button className="px-4 py-2 rounded-lg bg-[#F3F0FF] border-2 border-black transition-colors text-black cursor-pointer">
                    이전
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-[#F3F0FF] border-2 border-black text-black cursor-pointer">
                    1
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-[#F3F0FF] border-2 border-black transition-colors text-black cursor-pointer">
                    다음
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}