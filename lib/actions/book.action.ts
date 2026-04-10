'use server';
import { CreateBook, TextSegment } from "@/database/models/types";
import { connectToDatabase } from "@/database/mongoose";
import { generateSlug, serializeData,escapeRegex } from "../utils";
import mongoose, { Types } from "mongoose";
import Book from "@/database/models/book.model";
import { string, success } from "zod";
import BookSegment from "@/database/models/book-segment-model";
import { BookDownIcon } from "lucide-react";



export const getAllBooks = async () =>  {
    try {
        await connectToDatabase();
        const books = await Book.find().sort({ createdAt: -1 }).lean();

        return {
            success: true,
            data: serializeData(books)
        }
    } catch (error) {
        console.log('Error fetching books', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
    }
}

export const checkBookExists = async (title: string) => {
    try {
        await connectToDatabase();
        const slug = generateSlug(title);
        const existingBook = await Book.findOne({slug}).lean();

        if(existingBook){
            return {
                exists: true,
                book: serializeData(existingBook)
            }
        }


        return {
            exists: false
        }

    } catch (e) {
        console.log('Error on Check the book exists', e);
        return {
            exists: false, 
            error: e instanceof Error ? e.message : 'Unknown error occurred'
        }
    }
}


export const createBook = async (data:CreateBook) => {
    try{
        await connectToDatabase();
        const slug = generateSlug(data.title);
        const existingBook = await Book.findOne({ slug }).lean();

        if(existingBook){
            return {
                success: true,
                data: serializeData(existingBook),
                alreadyExists: true
            }
        }
        
        const book = await Book.create({...data, slug, totalSegments: 0});
        return {
            success: true,
            data: serializeData(book),
            alreadyExists: false
        }
    } catch (e) {
        console.error('Error creating a book', e)

        return {
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error occurred'
        }
    }
}

export const getBookBySlug = async (slug: string) => {
    try {
        await connectToDatabase();
        const book = await Book.findOne({ slug }).lean();

        if (!book) {
            return {
                success: false,
                data: null
            };
        }

        return {
            success: true,
            data: serializeData(book)
        };
    } catch (e) {
        console.error('Error fetching book by slug', e);
        return {
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error occurred',
            data: null
        };
    }
};

export const saveBookSegments = async (bookId: string, clerkId: string, segments: TextSegment[]) => {
    const bookObjectId = new Types.ObjectId(bookId);
    try {
        await connectToDatabase();

        

        const segmentsToInsert = segments.map(({text,segmentIndex,pageNumber, wordCount}) => ({
            clerkId,
            bookId: bookObjectId,
            content:text,
            segmentIndex,
            pageNumber,
            wordCount
        }));

        await BookSegment.insertMany(segmentsToInsert);
        await Book.findByIdAndUpdate(bookId, { totalSegments: segments.length });


        return {
            success: true,
            data: {segmentsCreated: segments.length}
        }
    } catch (e) {
        console.error('Error saving book segments', e);

        await BookSegment.deleteMany({ bookId: bookObjectId });
        await Book.findByIdAndDelete(bookId);

        console.log('Deleted book and segments due to failure to save segments');

        return {
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error occurred'
        }

    }

}

export const searchBookSegments = async (bookId: string, query: string, limit: number = 5) => {
    try {
        await connectToDatabase();


        const bookObjectId = new mongoose.Types.ObjectId(bookId);

        // Try MongoDB text search first (requires text index)
        let segments: Record<string, unknown>[] = [];
        try {
            segments = await BookSegment.find({
                bookId: bookObjectId,
                $text: { $search: query },
            })
                .select('_id bookId content segmentIndex pageNumber wordCount')
                .sort({ score: { $meta: 'textScore' } })
                .limit(limit)
                .lean();
        } catch {
            // Text index may not exist — fall through to regex fallback
            segments = [];
        }

        // Fallback: regex search matching ANY keyword
        if (segments.length === 0) {
            const keywords = query.split(/\s+/).filter((k) => k.length > 2);
            const pattern = keywords.map(escapeRegex).join('|');

            if(keywords.length === 0){
                return {
                    success:true,
                    data:[]
                }
            }
            segments = await BookSegment.find({
                bookId: bookObjectId,
                content: { $regex: pattern, $options: 'i' },
            })
                .select('_id bookId content segmentIndex pageNumber wordCount')
                .sort({ segmentIndex: 1 })
                .limit(limit)
                .lean();
        }


        return {
            success: true,
            data: serializeData(segments),
        };
    } catch (error) {
        console.error('Error searching segments:', error);
        return {
            success: false,
            error: (error as Error).message,
            data: [],
        };
    }
};