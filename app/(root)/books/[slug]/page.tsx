'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { IBook } from '@/database/models/types';
import { ArrowLeft } from 'lucide-react';
import VapiControls from '@/components/VapiControls';
import { getBookBySlug } from '@/lib/actions/book.action';

export default function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const [book, setBook] = useState<IBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      router.push('/');
      return;
    }

    const fetchBook = async () => {
      try {
        const result = await getBookBySlug(slug);
        if (result.success && result.data) {
          setBook(result.data as IBook);
        } else {
          setError(true);
          router.push('/');
        }
      } catch (err) {
        console.error('Error fetching book:', err);
        setError(true);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [isLoaded, userId, slug, router]);

  if (loading || !isLoaded) {
    return (
      <div className="book-page-container">
        <div className="h-screen flex items-center justify-center">
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!book || error) {
    return null;
  }

  return (
    <div className="book-page-container">
      {/* Floating Back Button */}
      <button
        onClick={() => router.push('/')}
        className="back-btn-floating"
        aria-label="Go back"
      >
        <ArrowLeft size={24} />
      </button>

      {/* Main Container - Stack vertically, centered with max-w-4xl */}
      <div className="mx-auto max-w-4xl px-6 py-20">
        {/* Header Card */}

      
        {/* Transcript Area */}
        <VapiControls book={book}/>
 
      </div>
    </div>
  );
}
