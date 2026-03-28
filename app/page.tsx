import BookCard from "@/components/ui/BookCard";
import HeroSection from "@/components/ui/HeroSection";
import Navbar from "@/components/ui/Navbar";
import { sampleBooks } from "@/lib/constants";
import Image from "next/image";

export default function Home() {
  return (
    <div >
      <Navbar/>
      <div className="wrapper container">

      
      <HeroSection />
      <div className="library-books-grid">
        {sampleBooks.map(book => (
          <BookCard 
          key={book._id} 
          title={book.title} 
          author={book.author}
          coverURL = {book.coverURL}
          slug={book.slug}
          />
        ))}
      </div>
    </div>
    </div>
  );
}
