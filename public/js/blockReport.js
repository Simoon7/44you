/**
 * 차단 기능 공통 JavaScript
 */

// 사용자 메뉴 토글
function toggleUserMenu(userId) {
  const menu = document.getElementById(`user-menu-${userId}`);
  if (menu) {
    // 다른 모든 메뉴 닫기
    document.querySelectorAll('.user-menu').forEach(m => {
      if (m.id !== `user-menu-${userId}`) {
        m.style.display = 'none';
      }
    });
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  }
}

// 채팅 사용자 메뉴 토글
function toggleChatUserMenu() {
  const menu = document.getElementById('chatUserMenu');
  if (menu) {
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  }
}

// 게시글 사용자 메뉴 토글
function togglePostUserMenu(userId, username) {
  const menu = document.getElementById(`post-user-menu-${userId}`);
  if (menu) {
    document.querySelectorAll('.user-menu').forEach(m => {
      if (m.id !== `post-user-menu-${userId}`) {
        m.style.display = 'none';
      }
    });
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  }
}

// 댓글 사용자 메뉴 토글
function toggleCommentUserMenu(userId, username, commentId) {
  const menu = document.getElementById(`comment-user-menu-${userId}-${commentId}`);
  if (menu) {
    document.querySelectorAll('.user-menu').forEach(m => {
      if (m.id !== `comment-user-menu-${userId}-${commentId}`) {
        m.style.display = 'none';
      }
    });
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  }
}

// 사용자 차단
async function blockUser(targetId, username, postAuthorId = null) {
  // 모든 메뉴 닫기
  document.querySelectorAll('.user-menu').forEach(m => m.style.display = 'none');
  
  // 커스텀 모달 표시
  const confirmDialog = document.createElement('div');
  confirmDialog.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
  confirmDialog.innerHTML = `
    <div style="background: white; padding: 2rem; border-radius: 1rem; max-width: 400px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
      <h3 style="margin: 0 0 1rem 0; color: var(--text-primary); font-size: 1.25rem;">차단하기</h3>
      <p style="margin: 0 0 2rem 0; color: var(--text-secondary); line-height: 1.6;">
        <strong>${username}</strong>님을 차단하시겠습니까?<br>
        차단된 상대는 추천/채팅/게시글에서 숨김 처리됩니다.
      </p>
      <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
        <button 
          id="cancelBlockBtn" 
          type="button"
          class="btn btn-outline"
          style="padding: 0.75rem 1.5rem;"
        >
          아니에요
        </button>
        <button 
          id="confirmBlockBtn" 
          type="button"
          class="btn btn-primary"
          style="padding: 0.75rem 1.5rem; background: #ef4444; border-color: #ef4444;"
        >
          차단할래요
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(confirmDialog);
  
  // 취소 버튼
  document.getElementById('cancelBlockBtn').addEventListener('click', () => {
    document.body.removeChild(confirmDialog);
  });
  
  // 확인 버튼
  document.getElementById('confirmBlockBtn').addEventListener('click', async () => {
    try {
      const response = await fetch('/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ target_id: targetId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        document.body.removeChild(confirmDialog);
        
        // 게시글 상세 페이지에서 게시글 작성자를 차단한 경우 목록으로 이동
        const currentPath = window.location.pathname;
        const isPostDetailPage = /^\/community\/\d+$/.test(currentPath);
        
        if (isPostDetailPage && postAuthorId && targetId === postAuthorId) {
          window.location.href = '/community';
        } else {
          // 페이지 새로고침
          window.location.reload();
        }
      } else {
        alert('차단 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('차단 오류:', error);
      alert('차단 처리 중 오류가 발생했습니다.');
    }
  });
}

// 채팅 사용자 차단
async function blockChatUser() {
  // 모든 메뉴 닫기
  document.querySelectorAll('.user-menu').forEach(m => m.style.display = 'none');
  
  const chatHeader = document.getElementById('chatHeader');
  const userName = document.getElementById('chatUserName').textContent;
  const targetUserId = chatHeader.getAttribute('data-target-user-id');
  
  if (!targetUserId) {
    alert('사용자 정보를 찾을 수 없습니다.');
    return;
  }
  
  await blockUser(parseInt(targetUserId), userName);
}


// 외부 클릭 시 메뉴 닫기
document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-menu-container') && 
      !e.target.closest('.chat-user-menu-container') &&
      !e.target.closest('.post-user-menu-container') &&
      !e.target.closest('.comment-user-menu-container') &&
      !e.target.closest('.ellipsis-btn')) {
    document.querySelectorAll('.user-menu').forEach(m => {
      m.style.display = 'none';
    });
  }
});

