import BookCard from "@/components/ui/BookCard";
import HeroSection from "@/components/ui/HeroSection";
import Navbar from "@/components/ui/Navbar";
import { getAllBooks } from "@/lib/actions/book.action";
import { sampleBooks } from "@/lib/constants";
import Image from "next/image";

export default async function Home() {

  const bookresults = await getAllBooks();
  console.log('Books from DB:', bookresults);
  const books = bookresults.success ? bookresults.data ?? [] : [];

  return (
    <div >
      <Navbar/>
      <div className="wrapper container">

      
      <HeroSection />
      <div className="library-books-grid">
        {books.map(book => (
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
