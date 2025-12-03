const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { Op } = require('sequelize');
const { getBlockedUserIds } = require('../utils/blockHelper');
const { checkBanStatus } = require('../middleware/banCheck');

// 인증 미들웨어
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/auth/login');
}

// 커뮤니티 목록
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId);
    
    // 차단된 사용자 ID 목록 가져오기
    const blockedUserIds = await getBlockedUserIds(req.session.userId);
    
    // 검색어 가져오기
    const searchQuery = req.query.search ? req.query.search.trim() : '';
    
    // where 조건 구성
    const whereConditions = [];
    
    // 차단된 사용자 필터
    if (blockedUserIds.length > 0) {
      whereConditions.push({
        userId: { [Op.notIn]: blockedUserIds }
      });
    }
    
    // 검색 조건 추가
    if (searchQuery) {
      // 사용자 이름으로 검색하여 해당 사용자 ID 목록 가져오기
      const matchingUsers = await User.findAll({
        where: {
          [Op.or]: [
            { username: { [Op.like]: `%${searchQuery}%` } },
            { nickname: { [Op.like]: `%${searchQuery}%` } }
          ]
        },
        attributes: ['id']
      });
      
      const matchingUserIds = matchingUsers.map(u => u.id);
      
      // 제목, 내용, 또는 작성자로 검색
      const searchConditions = [
        { title: { [Op.like]: `%${searchQuery}%` } },
        { content: { [Op.like]: `%${searchQuery}%` } }
      ];
      
      // 사용자 이름으로 검색된 경우 userId 조건 추가
      if (matchingUserIds.length > 0) {
        searchConditions.push({
          userId: { [Op.in]: matchingUserIds }
        });
      }
      
      whereConditions.push({
        [Op.or]: searchConditions
      });
    }
    
    const posts = await Post.findAll({
      where: whereConditions.length > 0 ? { [Op.and]: whereConditions } : {},
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['username', 'nickname']
        },
        {
          model: Comment,
          as: 'comments',
          attributes: ['id'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.render('community/list', { 
      posts,
      user,
      searchQuery
    });
  } catch (error) {
    console.error('커뮤니티 목록 오류:', error);
    res.render('community/list', { 
      posts: [],
      user: null,
      searchQuery: req.query.search || ''
    });
  }
});

// 게시글 작성 페이지
router.get('/write', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId);
    res.render('community/write', { 
      error: null,
      user
    });
  } catch (error) {
    console.error('게시글 작성 페이지 오류:', error);
    res.redirect('/community');
  }
});

// 게시글 작성 처리
router.post('/write', isAuthenticated, checkBanStatus, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      const user = await User.findByPk(req.session.userId);
      return res.render('community/write', { 
        error: '제목과 내용을 입력해주세요.',
        user
      });
    }

    await Post.create({
      title,
      content,
      userId: req.session.userId
    });

    res.redirect('/community');
  } catch (error) {
    console.error('게시글 작성 오류:', error);
    const user = await User.findByPk(req.session.userId);
    res.render('community/write', { 
      error: '게시글 작성 중 오류가 발생했습니다.',
      user
    });
  }
});

// 게시글 상세보기
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    // 차단된 사용자 ID 목록 가져오기
    const blockedUserIds = await getBlockedUserIds(req.session.userId);
    
    const post = await Post.findByPk(req.params.id, {
      where: blockedUserIds.length > 0 ? {
        userId: { [Op.notIn]: blockedUserIds }
      } : {},
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'nickname']
        },
        {
          model: Comment,
          as: 'comments',
          where: blockedUserIds.length > 0 ? {
            userId: { [Op.notIn]: blockedUserIds }
          } : {},
          required: false,
          include: [{
            model: User,
            as: 'commentAuthor',
            attributes: ['id', 'username', 'nickname']
          }],
          order: [['createdAt', 'ASC']]
        }
      ]
    });

    if (!post) {
      return res.redirect('/community');
    }

    // 조회수 증가
    await post.increment('views');

    // 댓글을 계층 구조로 재구성
    function buildCommentTree(comments) {
      const commentMap = new Map();
      const rootComments = [];

      // 모든 댓글을 맵에 저장
      comments.forEach(comment => {
        comment.replies = [];
        commentMap.set(comment.id, comment);
      });

      // 계층 구조 구성
      comments.forEach(comment => {
        if (comment.parentId === null) {
          rootComments.push(comment);
        } else {
          const parent = commentMap.get(comment.parentId);
          if (parent) {
            parent.replies.push(comment);
          } else {
            // 부모가 없는 경우 (차단된 부모 등) 루트로 추가
            rootComments.push(comment);
          }
      }
      });

      // 각 레벨에서 replies를 시간순으로 정렬
      function sortReplies(comment) {
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          comment.replies.forEach(reply => sortReplies(reply));
        }
      }

      rootComments.forEach(comment => sortReplies(comment));
      rootComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return rootComments;
    }

    const structuredComments = buildCommentTree(post.comments || []);

    const user = await User.findByPk(req.session.userId);
    res.render('community/detail', { 
      post: {
        ...post.toJSON(),
        comments: structuredComments
      },
      currentUserId: req.session.userId,
      user
    });
  } catch (error) {
    console.error('게시글 상세보기 오류:', error);
    res.redirect('/community');
  }
});

// 댓글 작성
router.post('/:id/comment', isAuthenticated, checkBanStatus, async (req, res) => {
  try {
    const { content, parentId } = req.body;
    const postId = req.params.id;

    if (!content || content.trim() === '') {
      return res.redirect(`/community/${postId}`);
    }

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.redirect('/community');
    }

    // 대댓글인 경우 부모 댓글이 존재하는지 확인
    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      if (!parentComment || parentComment.postId !== parseInt(postId)) {
        return res.redirect(`/community/${postId}`);
      }
      // 대댓글에 대한 대댓글은 불가능 (부모 댓글이 이미 대댓글인 경우 차단)
      if (parentComment.parentId !== null) {
        return res.redirect(`/community/${postId}`);
      }
    }

    await Comment.create({
      postId,
      userId: req.session.userId,
      content,
      parentId: parentId || null
    });

    res.redirect(`/community/${postId}`);
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    res.redirect(`/community/${req.params.id}`);
  }
});

// 댓글 삭제
router.post('/:postId/comment/:commentId/delete', isAuthenticated, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const comment = await Comment.findByPk(commentId);

    if (!comment || comment.userId !== req.session.userId) {
      return res.redirect(`/community/${postId}`);
    }

    await comment.destroy();
    res.redirect(`/community/${postId}`);
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    res.redirect(`/community/${req.params.postId}`);
  }
});

// 게시글 수정 페이지
router.get('/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.redirect('/community');
    }

    if (post.userId !== req.session.userId) {
      return res.redirect('/community');
    }

    const user = await User.findByPk(req.session.userId);
    res.render('community/edit', { 
      post, 
      error: null,
      user
    });
  } catch (error) {
    console.error('게시글 수정 페이지 오류:', error);
    res.redirect('/community');
  }
});

// 게시글 수정 처리
router.post('/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const { title, content } = req.body;
    const post = await Post.findByPk(req.params.id);

    if (!post || post.userId !== req.session.userId) {
      return res.redirect('/community');
    }

    await post.update({ title, content });
    res.redirect(`/community/${post.id}`);
  } catch (error) {
    console.error('게시글 수정 오류:', error);
    res.redirect('/community');
  }
});

// 게시글 삭제
router.post('/:id/delete', isAuthenticated, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post || post.userId !== req.session.userId) {
      return res.redirect('/community');
    }

    await post.destroy();
    res.redirect('/community');
  } catch (error) {
    console.error('게시글 삭제 오류:', error);
    res.redirect('/community');
  }
});

module.exports = router;

