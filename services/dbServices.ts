import { supabase } from './supabase';
import { UserProfile, ExaggerationMetrics, EssentialsLocation, Place, GuideProfile, FeedPost } from '../types';

export const dbServices = {
  // --- AUTHENTICATION ---
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName } // Sent to SQL trigger
      }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async getCurrentProfile() {
    const session = await this.getSession();
    if (!session?.user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (error) return null;
    return data;
  },

  async getProfileById(userId: string) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) return null;
      return data;
  },

  async updateProfile(updates: { name: string; username: string; bio: string; avatarFile?: File; expertise?: string[] }) {
      const session = await this.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Not authenticated");
      
      let avatarUrl = undefined;
      
      if (updates.avatarFile) {
          const fileExt = updates.avatarFile.name.split('.').pop();
          const fileName = `${userId}-avatar-${Math.random()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('post_images')
            .upload(fileName, updates.avatarFile);
            
          if (uploadError) throw uploadError;
          
          const { data } = supabase.storage.from('post_images').getPublicUrl(fileName);
          avatarUrl = data.publicUrl;
      }
      
      const payload: any = {
          name: updates.name,
          username: updates.username,
          bio: updates.bio
      };
      if (avatarUrl) payload.avatar_url = avatarUrl;
      if (updates.expertise !== undefined) payload.expertise = updates.expertise;
      
      const { data, error } = await supabase
          .from('profiles')
          .update(payload)
          .eq('id', userId)
          .select()
          .single();
          
      if (error) throw error;
      return data;
  },
      // --- PROFILES & GUIDES ---
  async getGuides() {
    const session = await this.getSession();
    const userId = session?.user?.id;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url, bio, is_guide, expertise, created_at, location, languages')
      .eq('is_guide', true);
      
    if (error) throw error;
    
    // Check follow status for the current user if logged in
    let followingIds = new Set<string>();
    if (userId) {
        const { data: followsData } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', userId);
        followingIds = new Set(followsData?.map(f => f.following_id) || []);
    }

    return data.map(guide => ({
        id: guide.id,
        name: guide.name,
        username: guide.username,
        expertise: guide.expertise || [],
        bio: guide.bio,
        rating: 4.8, // Static mockup for now
        reviews: Math.floor(Math.random() * 100) + 20,
        followers: Math.floor(Math.random() * 1000) + 100,
        isFollowing: followingIds.has(guide.id),
        avatarUrl: guide.avatar_url,
        location: guide.location,
        languages: guide.languages || []
    })) as GuideProfile[];
  },

  async upgradeToGuide(expertise: string[]) {
      const session = await this.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Must be logged in to become a guide.");

      const { data, error } = await supabase
        .from('profiles')
        .update({ 
            is_guide: true,
            expertise: expertise
        })
        .eq('id', userId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
  },

  async toggleFollow(guideId: string, currentlyFollowing: boolean) {
    const session = await this.getSession();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Must be logged in to follow");

    if (currentlyFollowing) {
        const { error } = await supabase
            .from('follows')
            .delete()
            .match({ follower_id: userId, following_id: guideId });
        if (error) throw error;
    } else {
        const { error } = await supabase
            .from('follows')
            .insert({ follower_id: userId, following_id: guideId });
        if (error) throw error;
    }
  },
  // --- FEED POSTS ---
  async uploadFeedPost(imageFile: File, caption: string, locationStr: string, lat?: number, lng?: number) {
      const session = await this.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Must be logged in to post");

      // 1. Upload image to Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post_images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('post_images')
        .getPublicUrl(fileName);

      // 3. Insert Post Record
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
            author_id: userId,
            image_url: publicUrl,
            caption: caption,
            location: locationStr,
            lat,
            lng
        })
        .select()
        .single();

      if (postError) throw postError;
      return postData;
  },

  async getFeedPosts() {
     const session = await this.getSession();
     const userId = session?.user?.id;

     // Fetch posts with author details and comment counts
     const { data: posts, error } = await supabase
        .from('posts')
        .select(`
            *,
            author:profiles!posts_author_id_fkey(name, avatar_url, is_guide),
            comments:comments (count),
            likes:post_likes (count)
        `)
        .order('created_at', { ascending: false });

     if (error) throw error;

     // Fetch likes for current user if logged in
     let likedPostIds = new Set<string>();
     if (userId) {
         const { data: userLikes } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', userId);
         likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);
     }

     return posts.map(post => ({
        id: post.id,
        author: {
            id: post.author_id,
            name: post.author?.name || 'Unknown',
            avatarUrl: post.author?.avatar_url || '',
            isGuide: post.author?.is_guide || false
        },
        location: post.location,
        imageUrl: post.image_url,
        caption: post.caption,
        likes: post.likes[0]?.count || 0,
        comments: post.comments[0]?.count || 0,
        timestamp: new Date(post.created_at).toLocaleDateString(),
        isLiked: likedPostIds.has(post.id)
     })) as FeedPost[];
  },

  async getUserPosts(userId: string) {
     const { data: posts, error } = await supabase
        .from('posts')
        .select(`
            *,
            author:profiles!posts_author_id_fkey(name, avatar_url, is_guide),
            comments:comments (count),
            likes:post_likes (count)
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

     if (error) throw error;

     // Fetch likes for user
     let likedPostIds = new Set<string>();
     const session = await this.getSession();
     const currentUserId = session?.user?.id;
     
     if (currentUserId && posts.length > 0) {
         const postIds = posts.map((p: any) => p.id);
         const { data: userLikes } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', currentUserId)
            .in('post_id', postIds);
         likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);
     }

     return posts.map((post: any) => ({
        id: post.id,
        author: {
            id: post.author_id,
            name: post.author?.name || 'Unknown',
            avatarUrl: post.author?.avatar_url || '',
            isGuide: post.author?.is_guide || false
        },
        location: post.location,
        imageUrl: post.image_url,
        caption: post.caption,
        likes: post.likes[0]?.count || 0,
        comments: post.comments[0]?.count || 0,
        timestamp: new Date(post.created_at).toLocaleDateString(),
        isLiked: likedPostIds.has(post.id)
     })) as FeedPost[];
  },

  async toggleLike(postId: string, currentlyLiked: boolean) {
      const session = await this.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Must be logged in to like");

      if (currentlyLiked) {
         const { error } = await supabase
            .from('post_likes')
            .delete()
            .match({ post_id: postId, user_id: userId });
         if (error) throw error;
      } else {
         const { error } = await supabase
            .from('post_likes')
            .insert({ post_id: postId, user_id: userId });
         if (error) throw error;
      }
  },

  async deletePost(postId: string) {
      const session = await this.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Must be logged in to delete");
      
      const { error } = await supabase
        .from('posts')
        .delete()
        .match({ id: postId, author_id: userId });
        
      if (error) throw error;
  },

  // --- COMMENTS ---
  async getComments(postId: string) {
      const session = await this.getSession();
      const userId = session?.user?.id;

      const { data, error } = await supabase
        .from('comments')
        .select(`
            *, 
            author:profiles!comments_author_id_fkey(name, avatar_url),
            likes:comment_likes(count)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;

      let likedCommentIds = new Set<string>();
      if (userId && data.length > 0) {
          const commentIds = data.map(c => c.id);
          const { data: userLikes } = await supabase
            .from('comment_likes')
            .select('comment_id')
            .eq('user_id', userId)
            .in('comment_id', commentIds);
          likedCommentIds = new Set(userLikes?.map(l => l.comment_id) || []);
      }

      return data.map(comment => ({
          ...comment,
          likesCount: comment.likes[0]?.count || 0,
          isLiked: likedCommentIds.has(comment.id)
      }));
  },

  async addComment(postId: string, content: string, parentId?: string) {
      const session = await this.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Must be logged in to comment");

      const { data, error } = await supabase
        .from('comments')
        .insert({
            post_id: postId,
            author_id: userId,
            content: content,
            parent_id: parentId || null
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
  },

  async toggleCommentLike(commentId: string, currentlyLiked: boolean) {
      const session = await this.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Must be logged in to like");

      if (currentlyLiked) {
         const { error } = await supabase
            .from('comment_likes')
            .delete()
            .match({ comment_id: commentId, user_id: userId });
         if (error) throw error;
      } else {
         const { error } = await supabase
            .from('comment_likes')
            .insert({ comment_id: commentId, user_id: userId });
         if (error) throw error;
      }
  },

  // --- SAVED PLACES ---
  async getSavedPlaces() {
      const session = await this.getSession();
      const userId = session?.user?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from('saved_places')
        .select('*')
        .eq('user_id', userId);
        
      if (error) throw error;
      return data;
  },

  async toggleSavedPlace(place: Place, isCurrentlySaved: boolean) {
      const session = await this.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Must be logged in to save places");

      if (isCurrentlySaved) {
          const { error } = await supabase
            .from('saved_places')
            .delete()
            .match({ user_id: userId, name: place.name });
            
          if (error) throw error;
      } else {
          const { error } = await supabase
            .from('saved_places')
            .insert({
                user_id: userId,
                name: place.name,
                address: place.address,
                rating: place.rating,
                photo_url: place.photoUrl,
                tags: place.tags || []
            });
            
          if (error) throw error;
      }
  },

  // --- MESSAGING & CHAT ---
  async getMessages(recipientId: string) {
      const session = await this.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Must be logged in to view messages");

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${userId})`)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      return data;
  },

  async sendMessage(recipientId: string, content: string) {
      const session = await this.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Must be logged in to send messages");

      const { data, error } = await supabase
        .from('messages')
        .insert({
            sender_id: userId,
            recipient_id: recipientId,
            content: content,
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
  },

  async bookAppointment(guideId: string, dateStr: string, notes?: string) {
      const session = await this.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Must be logged in to book an appointment");

      const { data, error } = await supabase
        .from('appointments')
        .insert({
            user_id: userId,
            guide_id: guideId,
            appointment_date: dateStr,
            status: 'pending',
            notes: notes || ''
        })
        .select()
        .single();

      if (error) throw error;
      return data;
  },

  async getAppointments() {
       const session = await this.getSession();
       const userId = session?.user?.id;
       if (!userId) throw new Error("Must be logged in to view appointments");

       const { data, error } = await supabase
          .from('appointments')
          .select(`
             *,
             guide:profiles!appointments_guide_id_fkey(name, avatar_url)
          `)
          .eq('user_id', userId)
          .order('appointment_date', { ascending: true });

       if (error) throw error;
       return data;
  },

  async getReceivedAppointments() {
       const session = await this.getSession();
       const userId = session?.user?.id;
       if (!userId) throw new Error("Must be logged in to view appointments");

       const { data, error } = await supabase
          .from('appointments')
          .select(`
             *,
             user:profiles!appointments_user_id_fkey(name, avatar_url, username)
          `)
          .eq('guide_id', userId)
          .order('appointment_date', { ascending: false });

       if (error) throw error;
       return data;
  },

  async updateAppointmentStatus(appointmentId: string, status: 'confirmed' | 'cancelled' | 'completed') {
       const { data, error } = await supabase
          .from('appointments')
          .update({ status })
          .eq('id', appointmentId)
          .select()
          .single();
          
       if (error) throw error;
       return data;
  },

  // --- TOUR PACKAGES ---
  async createTourPackage(title: string, description: string, price: number, durationHours: number, maxPeople: number) {
       const session = await this.getSession();
       const userId = session?.user?.id;
       if (!userId) throw new Error("Must be logged in to create tour packages");

       const { data, error } = await supabase
          .from('tour_packages')
          .insert({
              guide_id: userId,
              title,
              description,
              price,
              duration_hours: durationHours,
              max_people: maxPeople
          })
          .select()
          .single();
          
       if (error) throw error;
       return data;
  },

  async getTourPackages(guideId: string) {
       const { data, error } = await supabase
          .from('tour_packages')
          .select('*')
          .eq('guide_id', guideId)
          .order('created_at', { ascending: false });

       if (error) throw error;
       return data;
  },

  async bookTourPackage(packageId: string, guideId: string, dateStr: string, message?: string) {
       const session = await this.getSession();
       const userId = session?.user?.id;
       if (!userId) throw new Error("Must be logged in to book a tour package");

       const { data, error } = await supabase
          .from('tour_requests')
          .insert({
              package_id: packageId,
              user_id: userId,
              guide_id: guideId,
              requested_date: dateStr,
              message: message || '',
              status: 'pending'
          })
          .select()
          .single();

       if (error) throw error;
       return data;
  },

  async getTourRequests() {
       const session = await this.getSession();
       const userId = session?.user?.id;
       if (!userId) throw new Error("Must be logged in to view requests");

       const { data, error } = await supabase
          .from('tour_requests')
          .select(`
             *,
             package:tour_packages(*),
             user:profiles!tour_requests_user_id_fkey(name, avatar_url, username)
          `)
          .eq('guide_id', userId)
          .order('created_at', { ascending: false });

       if (error) throw error;
       return data;
  },
  
  async updateTourRequestStatus(requestId: string, status: 'accepted' | 'rejected' | 'completed') {
       const { data, error } = await supabase
          .from('tour_requests')
          .update({ status })
          .eq('id', requestId)
          .select()
          .single();
          
       if (error) throw error;
       return data;
  },

  // --- ESSENTIALS ---
  async addEssentialsLocation(type: 'water_fountain' | 'public_toilet', lat: number, lng: number, name?: string, description?: string) {
       const session = await this.getSession();
       const userId = session?.user?.id;
       
       const { data, error } = await supabase
          .from('essentials_locations')
          .insert({
              type,
              lat,
              lng,
              name,
              description,
              added_by: userId || null
          })
          .select()
          .single();

       if (error) throw error;
       return data;
  },

  async getEssentialsLocations() {
      const { data: locations, error: locError } = await supabase
          .from('essentials_locations')
          .select('*');
          
      if (locError && locError.code !== '42P01') throw locError;
      
      const { data: allReviews } = await supabase
          .from('essentials_reviews')
          .select('location_id, rating');
      
      const safeLocs = locations || [];
      const safeReviews = allReviews || [];

      return safeLocs.map(loc => {
           const locReviews = safeReviews.filter(r => r.location_id === loc.id.toString());
           const sum = locReviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
           return {
               ...loc,
               averageRating: locReviews.length > 0 ? sum / locReviews.length : undefined,
               reviewCount: locReviews.length
           };
      }) as EssentialsLocation[];
  },

  // --- EXAGGERATION RATINGS ---
  async addExaggerationRating(placeId: string, waitingTime: number, taste: number, crowdedness: number, view: number, comments?: string) {
       const session = await this.getSession();
       const userId = session?.user?.id;
       if (!userId) throw new Error("Must be logged in to rate");
       
       const overallScore = (waitingTime + taste + crowdedness + view) / 4;

       const { data, error } = await supabase
          .from('exaggeration_ratings')
          .upsert({
              place_id: placeId,
              user_id: userId,
              waiting_time_score: waitingTime,
              taste_score: taste,
              crowdedness_score: crowdedness,
              view_score: view,
              overall_exaggeration_score: overallScore,
              comments
          }, { onConflict: 'place_id,user_id' })
          .select()
          .single();

       if (error) throw error;
       return data;
  },

  async getExaggerationRatings(placeId: string) {
       const { data, error } = await supabase
          .from('exaggeration_ratings')
          .select(`
             *,
             user:profiles!exaggeration_ratings_user_id_fkey(name, avatar_url)
          `)
          .eq('place_id', placeId);

       if (error) throw error;
       return data;
  },

  async getEssentialsReviews(locationId: string) {
      const { data, error } = await supabase
          .from('essentials_reviews')
          .select('*, profiles(name, avatar_url)')
          .eq('location_id', locationId)
          .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      return data || [];
  },

  async addEssentialReview(locationId: string, rating: number, comment: string) {
      const session = await this.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("Must be logged in to review.");

      const { data, error } = await supabase
          .from('essentials_reviews')
          .insert({
              location_id: locationId,
              user_id: userId,
              rating,
              comment
          })
          .select()
          .single();
      
      if (error) throw error;
      return data;
  }
};
