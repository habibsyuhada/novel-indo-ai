import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Tipe data untuk komentar
type Comment = {
  id: number;
  created_at: string;
  novel_id: number | null;
  chapter_id: number | null;
  comment: string;
  user_id: string;
  user_email?: string;
  name?: string | null;
};

// Props untuk komponen
type CommentSectionProps = {
  novelId?: number;
  chapterId?: number;
};

// Fungsi untuk membuat avatar dengan warna dan inisial berdasarkan user_id
const generateAvatarData = (userId: string) => {
  // Menggunakan user_id untuk menghasilkan warna yang konsisten untuk pengguna yang sama
  const hash = Array.from(userId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Generate warna HSL berdasarkan hash
  const hue = hash % 360;
  const saturation = 70; // Tetap tinggi untuk warna-warna yang hidup
  const lightness = 60; // Tidak terlalu gelap atau terang
  
  // Generate inisial dari user_id (2 karakter pertama)
  // Kita bisa menggunakan 2 digit terakhir dari user_id untuk inisial
  const initials = userId.slice(-2).toUpperCase();
  
  return {
    backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    initials
  };
};

// Fungsi untuk memformat tanggal
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

// Fungsi untuk mendapatkan username dari email/id
const getUserName = (userId: string, email?: string | null, name?: string | null) => {
  // Jika ada nama yang tersimpan, gunakan nama tersebut
  if (name) {
    return name;
  }
  
  if (email) {
    // Jika ada email, gunakan bagian sebelum @ sebagai username
    const username = email.split('@')[0];
    return username;
  }
  
  // Jika tidak ada email atau nama, gunakan 8 karakter pertama dari ID
  return `User-${userId.substring(0, 8)}`;
};

export default function CommentSection({ novelId, chapterId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Ambil komentar saat komponen dimuat atau ketika ID berubah
  useEffect(() => {
    if (!novelId && !chapterId) return;
    
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('comment')
          .select('*')
          .order('created_at', { ascending: false });
        
        // Jika berada di halaman chapter, ambil komentar berdasarkan chapter_id
        if (chapterId) {
          query = query.eq('chapter_id', chapterId);
        } 
        // Jika berada di halaman novel, ambil komentar dengan novel_id yang cocok dan chapter_id null
        else if (novelId) {
          query = query.eq('novel_id', novelId).is('chapter_id', null);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        setComments(data || []);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchComments();
  }, [novelId, chapterId]);
  
  // Kirim komentar baru
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      // Memotong nama pengguna untuk disimpan di kolom name
      const userName = getUserName(user.id, user.email);
      
      // Jika chapterId ada, gunakan itu saja, jika tidak gunakan novelId
      const commentData: {
        user_id: string;
        comment: string;
        name: string;
        novel_id?: number;
        chapter_id?: number | null;
      } = {
        user_id: user.id,
        comment: newComment.trim(),
        name: userName
      };

      // Tambahkan ID yang sesuai
      if (chapterId) {
        // Komentar untuk halaman chapter
        commentData.chapter_id = chapterId;
        // Jika komentar pada chapter, tambahkan juga novel_id untuk referensi
        if (novelId) {
          commentData.novel_id = novelId;
        }
      } else if (novelId) {
        // Komentar untuk halaman novel
        commentData.novel_id = novelId;
        commentData.chapter_id = null; // Pastikan chapter_id null untuk komentar novel
      }
      
      const { data, error } = await supabase
        .from('comment')
        .insert([commentData])
        .select();
        
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        // Tambahkan komentar baru ke state
        setComments([data[0], ...comments]);
        // Kosongkan form
        setNewComment('');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="my-8">
      <h3 className="text-xl font-bold mb-4">Komentar</h3>
      
      {/* Form komentar - hanya ditampilkan jika user login */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: generateAvatarData(user.id).backgroundColor }}
              >
                {generateAvatarData(user.id).initials}
              </div>
            </div>
            <div className="flex-grow">
              <div className="mb-2 text-sm">
                <span className="font-medium">{getUserName(user.id, user.email)}</span>
              </div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Tulis komentar Anda..."
                className="w-full textarea textarea-bordered"
                rows={3}
                required
              />
              <button 
                type="submit" 
                className="btn btn-primary mt-2"
                disabled={isSubmitting || !newComment.trim()}
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Kirim'
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="alert alert-info mb-6">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current flex-shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Silakan <Link href="/login" className="link link-primary">login</Link> untuk menambahkan komentar.</span>
          </div>
        </div>
      )}
      
      {/* Daftar komentar */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-4 bg-base-200 rounded-lg">
              <div className="flex-shrink-0">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: generateAvatarData(comment.user_id).backgroundColor }}
                >
                  {generateAvatarData(comment.user_id).initials}
                </div>
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm opacity-70">
                    {/* Tampilkan nama jika tersedia, jika tidak gunakan fungsi getUserName */}
                    {getUserName(comment.user_id, undefined, comment.name)}
                  </span>
                  <span className="text-xs opacity-50">{formatDate(comment.created_at)}</span>
                </div>
                <p className="whitespace-pre-line">{comment.comment}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 opacity-70">
            Belum ada komentar. Jadilah yang pertama berkomentar!
          </div>
        )}
      </div>
    </div>
  );
} 