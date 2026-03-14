import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FeedPost } from '../types';
import { Heart, MessageCircle, Share2, MapPin, MoreHorizontal, Upload, X, Camera, Trash2, UserMinus, CheckCircle2 } from 'lucide-react';
import { dbServices } from '../services/dbServices';

import Modal from '../components/Modal';

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<{type: 'comment'|'share'|'options'|'create', postId?: string} | null>(null);
  
  // Create Post State
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [newPostPreview, setNewPostPreview] = useState<string>('');
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostLocation, setNewPostLocation] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Comments specific state
  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{id: string, name: string} | null>(null);

  const [currentProfile, setCurrentProfile] = useState<any>(null);

  useEffect(() => {
     loadPosts();
     dbServices.getCurrentProfile().then(setCurrentProfile).catch(() => null);
  }, []);

  const loadPosts = async () => {
      try {
          setLoading(true);
          const data = await dbServices.getFeedPosts();
          setPosts(data);
      } catch (err) {
          console.error("Failed to load feed posts:", err);
      } finally {
          setLoading(false);
      }
  };

  const toggleLike = async (id: string, currentlyLiked: boolean) => {
    // Optimistic UI update
    setPosts(prev => prev.map(post => 
      post.id === id 
        ? { ...post, isLiked: !currentlyLiked, likes: currentlyLiked ? post.likes - 1 : post.likes + 1 } 
        : post
    ));

    try {
        await dbServices.toggleLike(id, currentlyLiked);
    } catch (err) {
        console.error("Failed to toggle like:", err);
        // Revert on error
        setPosts(prev => prev.map(post => 
            post.id === id 
              ? { ...post, isLiked: currentlyLiked, likes: currentlyLiked ? post.likes + 1 : post.likes - 1 } 
              : post
          ));
    }
  };

  // When comment modal opens, load comments
  useEffect(() => {
      if (activeModal?.type === 'comment') {
          loadComments(activeModal.postId);
      }
  }, [activeModal]);

  const loadComments = async (postId: string) => {
      setLoadingComments(true);
      try {
          const data = await dbServices.getComments(postId);
          setComments(data);
      } catch (err) {
          console.error("Failed to load comments:", err);
      } finally {
           setLoadingComments(false);
      }
  };

  const handlePostComment = async () => {
      if (!commentInput.trim() || !activeModal || !activeModal.postId) return;
      
      try {
          await dbServices.addComment(activeModal.postId, commentInput, replyingTo?.id);
          setCommentInput('');
          setReplyingTo(null);
          // Reload comments and update comment count on the post
          await loadComments(activeModal.postId);
          setPosts(prev => prev.map(p => p.id === activeModal.postId ? { ...p, comments: p.comments + 1 } : p));
      } catch (err) {
          console.error("Failed to post comment:", err);
      }
  };

  const handleToggleCommentLike = async (commentId: string, currentlyLiked: boolean) => {
      try {
          // Optimistic local toggle
          setComments(prev => prev.map(c => 
              c.id === commentId 
              ? { ...c, isLiked: !currentlyLiked, likesCount: currentlyLiked ? c.likesCount - 1 : c.likesCount + 1 } 
              : c
          ));
          await dbServices.toggleCommentLike(commentId, currentlyLiked);
      } catch (err) {
          console.error("Failed to like comment:", err);
      }
  };

  const handleDeletePost = async (postId: string) => {
      if (!confirm("Are you sure you want to delete this post?")) return;
      try {
          await dbServices.deletePost(postId);
          setPosts(prev => prev.filter(p => p.id !== postId));
          setActiveModal(null);
      } catch (err) {
          console.error("Failed to delete post:", err);
          alert("Could not delete post.");
      }
  };

  const handleShare = async (urlSuffix: string) => {
      const fullUrl = window.location.origin + window.location.pathname + "#" + urlSuffix;
      try {
          await navigator.clipboard.writeText(fullUrl);
          alert("Link copied to clipboard!");
          setActiveModal(null);
      } catch (err) {
          console.error("Failed to copy text:", err);
          alert("Could not copy link. " + fullUrl);
      }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setNewPostImage(file);
          const reader = new FileReader();
          reader.onloadend = () => setNewPostPreview(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPostImage || !newPostCaption.trim() || !newPostLocation.trim()) return;

      setIsUploading(true);
      try {
          const newPost = await dbServices.uploadFeedPost(newPostImage, newPostCaption, newPostLocation);
          
          // Get current user profile for optimistic rendering
          const profile = await dbServices.getCurrentProfile();
          
          if (profile) {
              const newFeedPost: FeedPost = {
                  id: newPost.id,
                  author: {
                      id: profile.id,
                      name: profile.name || 'Unknown',
                      avatarUrl: profile.avatar_url || '',
                      isGuide: profile.is_guide || false
                  },
                  location: newPost.location,
                  imageUrl: newPost.image_url,
                  caption: newPost.caption,
                  likes: 0,
                  comments: 0,
                  timestamp: new Date().toLocaleDateString(),
                  isLiked: false
              };
              setPosts(prev => [newFeedPost, ...prev]);
          }

          // Reset form
          setNewPostImage(null);
          setNewPostPreview('');
          setNewPostCaption('');
          setNewPostLocation('');
          setActiveModal(null);
      } catch (err) {
          console.error("Failed to create post:", err);
          alert("Failed to create post. Are you logged in?");
      } finally {
          setIsUploading(false);
      }
  };

  if (loading) return <div className="text-center py-20">Loading Feed...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Create Post Button */}
      <div className="mb-8">
          <button 
              onClick={() => setActiveModal({ type: 'create' })}
              className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-4 flex items-center justify-center gap-3 text-gray-500 hover:bg-gray-50 transition-colors font-medium group"
          >
              <div className="bg-indigo-50 text-indigo-600 p-3 rounded-full group-hover:bg-indigo-100 transition-colors">
                  <Camera size={24} />
              </div>
              <span className="text-lg">Share your latest adventure...</span>
          </button>
      </div>

      <div className="space-y-10">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group/post">
            <div className="p-5 flex items-center justify-between">
              <Link to={`/profile/${post.author.id}`} className="flex items-center gap-3 group">
                <img src={post.author.avatarUrl || 'https://via.placeholder.com/150'} alt={post.author.name} className="w-12 h-12 rounded-full object-cover shadow-sm group-hover:ring-2 ring-indigo-500 ring-offset-2 transition-all" />
                <div>
                  <h3 className="font-bold text-[15px] text-gray-900 flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                    {post.author.name}
                    {post.author.isGuide && <CheckCircle2 size={16} className="text-blue-500 fill-current" />}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 font-medium mt-0.5">
                    <MapPin size={12} className="text-indigo-500" /> {post.location}
                  </p>
                </div>
              </Link>
              <button 
                  onClick={() => setActiveModal({ type: 'options', postId: post.id })} 
                  className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
               >
                <MoreHorizontal size={24} />
              </button>
            </div>

            <div className="bg-gray-100 relative w-full aspect-[4/5] sm:aspect-square">
                <img src={post.imageUrl} alt={post.caption} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/post:opacity-100 transition-opacity"></div>
            </div>

            {/* Actions */}
            <div className="p-5 pb-3 flex items-center gap-5">
              <button onClick={() => toggleLike(post.id, post.isLiked)} className={`transition-all active:scale-90 ${post.isLiked ? 'text-red-500' : 'text-gray-900 hover:text-gray-600'}`}>
                <Heart size={28} className={post.isLiked ? 'fill-current' : ''} />
              </button>
              <button onClick={() => setActiveModal({ type: 'comment', postId: post.id })} className="text-gray-900 hover:text-gray-600 transition-colors active:scale-95">
                <MessageCircle size={28} />
              </button>
              <button onClick={() => setActiveModal({ type: 'share', postId: post.id })} className="text-gray-900 hover:text-gray-600 ml-auto transition-colors active:scale-95">
                <Share2 size={26} />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 pb-6">
              <p className="font-bold text-[15px] mb-2 text-gray-900">{post.likes.toLocaleString()} likes</p>
              <p className="text-[15px] text-gray-800 leading-relaxed">
                <Link to={`/profile/${post.author.id}`} className="font-bold mr-2 hover:underline">{post.author.name}</Link>
                {post.caption}
              </p>
              
              {post.comments > 0 && (
                  <button onClick={() => setActiveModal({ type: 'comment', postId: post.id })} className="text-gray-500 text-sm mt-3 font-medium hover:text-gray-800 transition-colors">
                    View all {post.comments} comments
                  </button>
              )}
              
              <p className="text-xs text-gray-400 uppercase mt-2 tracking-wide font-medium">{post.timestamp}</p>
            </div>
          </div>
        ))}

        {posts.length === 0 && <div className="text-center text-gray-500">No posts available.</div>}
      </div>

       <Modal isOpen={activeModal?.type === 'share'} onClose={() => setActiveModal(null)} title="Share Post">
          <div className="flex flex-col gap-4">
              <button onClick={() => handleShare(`/feed`)} className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 hover:border-indigo-100 transition-all text-left">
                  <div className="bg-indigo-50 text-indigo-600 p-3 rounded-full"><Share2 size={20}/></div>
                  <div>
                      <span className="font-bold text-gray-900 block">Copy Link</span>
                      <span className="text-sm text-gray-500 block">Share this post anywhere</span>
                  </div>
              </button>
          </div>
      </Modal>

      <Modal isOpen={activeModal?.type === 'comment'} onClose={() => setActiveModal(null)} title="Comments">
          <div className="h-80 overflow-y-auto mb-4 flex flex-col gap-6 pr-2">
              {loadingComments ? (
                 <p className="text-gray-500 text-center mt-10 font-medium">Loading comments...</p>
              ) : comments.length > 0 ? (
                 comments.map(c => (
                     <div key={c.id} className={`flex gap-3 text-[15px] ${c.parent_id ? 'ml-12 relative before:absolute before:-left-8 before:top-4 before:w-6 before:h-px before:bg-gray-200' : ''}`}>
                         <Link to={`/profile/${c.author_id}`} className="shrink-0"><img src={c.author.avatar_url} className="w-8 h-8 rounded-full bg-gray-100 object-cover" /></Link>
                         <div className="flex-1">
                             <div className="bg-gray-50 rounded-2xl px-4 py-2 inline-block">
                                 <Link to={`/profile/${c.author_id}`} className="font-bold mr-2 hover:underline text-gray-900">{c.author.name}</Link>
                                 <span className="text-gray-800">{c.content}</span>
                             </div>
                             <div className="flex items-center gap-4 text-xs text-gray-500 mt-1.5 ml-3 font-medium">
                                 <span>{new Date(c.created_at).toLocaleDateString()}</span>
                                 <button onClick={() => setReplyingTo({id: c.parent_id || c.id, name: c.author.name})} className="hover:text-gray-900 transition-colors">Reply</button>
                             </div>
                         </div>
                         <button 
                             onClick={() => handleToggleCommentLike(c.id, c.isLiked)} 
                             className="flex flex-col items-center gap-1 self-start pt-2 px-2 hover:opacity-70 transition-opacity"
                         >
                             <Heart size={14} className={c.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                             {c.likesCount > 0 && <span className="text-[10px] font-bold text-gray-400">{c.likesCount}</span>}
                         </button>
                     </div>
                 ))
              ) : (
                  <p className="text-gray-500 text-center mt-10 font-medium">No comments yet. Start the conversation!</p>
              )}
          </div>
          
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 relative">
              {replyingTo && (
                  <div className="flex items-center justify-between text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg mb-1">
                      <span className="font-bold">Replying to {replyingTo.name}</span>
                      <button onClick={() => setReplyingTo(null)} className="hover:text-indigo-800"><X size={14}/></button>
                  </div>
              )}
              <div className="flex gap-2 items-end">
                  <textarea 
                     rows={1}
                     placeholder="Add a comment..." 
                     value={commentInput}
                     onChange={(e) => setCommentInput(e.target.value)}
                     className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none max-h-32 min-h-[48px]" 
                  />
                  <button 
                      onClick={handlePostComment} 
                      className="text-white bg-indigo-600 font-bold px-5 h-12 rounded-xl hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 disabled:shadow-none" 
                      disabled={!commentInput.trim()}
                  >
                      Post
                  </button>
              </div>
          </div>
      </Modal>

      <Modal isOpen={activeModal?.type === 'options'} onClose={() => setActiveModal(null)} title="Post Options">
         <div className="flex flex-col text-left text-[15px]">
              {currentProfile && posts.find(p => p.id === activeModal?.postId)?.author.id === currentProfile.id ? (
                  <button 
                      onClick={() => activeModal?.postId && handleDeletePost(activeModal.postId)}
                      className="text-red-600 font-bold p-4 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors"
                  >
                      <Trash2 size={20} /> Delete Post
                  </button>
              ) : (
                  <>
                      <button className="text-red-500 font-bold p-4 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors">
                          Report Post
                      </button>
                      <button className="text-gray-900 font-bold p-4 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors">
                          <UserMinus size={20} /> Unfollow Author
                      </button>
                  </>
              )}
              <div className="h-px bg-gray-100 my-2"></div>
              <button className="text-gray-500 font-bold p-4 hover:bg-gray-50 rounded-xl flex items-center justify-center transition-colors" onClick={() => setActiveModal(null)}>
                  Cancel
              </button>
         </div>
      </Modal>

      <Modal isOpen={activeModal?.type === 'create'} onClose={() => setActiveModal(null)} title="Create New Post">
         <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
             {!newPostPreview ? (
                 <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required
                    />
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-600">Click or drag a photo to upload</p>
                 </div>
             ) : (
                 <div className="relative w-full aspect-square md:aspect-video rounded-2xl overflow-hidden bg-gray-100">
                     <img src={newPostPreview} alt="Preview" className="w-full h-full object-contain" />
                     <button 
                         type="button" 
                         onClick={() => { setNewPostPreview(''); setNewPostImage(null); }}
                         className="absolute top-2 right-2 bg-gray-900/50 p-1.5 text-white rounded-full hover:bg-gray-900 transition-colors"
                     >
                         <X size={20} />
                     </button>
                 </div>
             )}

             <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                 <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="e.g. Trastevere, Rome" 
                        value={newPostLocation}
                        onChange={(e) => setNewPostLocation(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        required
                    />
                 </div>
             </div>

             <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Caption</label>
                 <textarea 
                     placeholder="Write a caption..." 
                     rows={3}
                     value={newPostCaption}
                     onChange={(e) => setNewPostCaption(e.target.value)}
                     className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                     required
                 ></textarea>
             </div>

             <button 
                 type="submit" 
                 disabled={isUploading || !newPostImage || !newPostCaption || !newPostLocation}
                 className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 mt-2"
             >
                 {isUploading ? 'Uploading Post...' : 'Share Post'}
             </button>
         </form>
      </Modal>

    </div>
  );
};

export default Feed;
