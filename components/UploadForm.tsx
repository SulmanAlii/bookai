'use client'

import React, { useState, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Upload, Image, X, Router } from 'lucide-react'
import LoadingOverlay from './LoadingOverlay'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { checkBookExists, createBook, saveBookSegments } from '@/lib/actions/book.action'
import { Form } from './ui/form'
import { useRouter } from 'next/navigation'
import { parsePDFFile } from '@/lib/utils'
import { upload } from '@vercel/blob/client'
import { UploadSchema } from '@/lib/zod'
import { BookUploadFormValues } from '@/database/models/types'

// Define validation schema
const bookUploadSchema = z.object({
  pdfFile: z.instanceof(File).refine((file) => file.size <= 50 * 1024 * 1024, {
    message: 'PDF file must be less than 50MB',
  }),
  coverImage: z.instanceof(File).optional(),
  title: z.string().min(1, 'Title is required').max(200),
  author: z.string().min(1, 'Author name is required').max(200),
  voice: z.enum(['Dave', 'Daniel', 'Chris', 'Rachel', 'Sarah']),
})

type BookUploadFormData = z.infer<typeof bookUploadSchema>

const VOICE_OPTIONS = {
  maleVoices: [
    { name: 'Dave', description: 'Deep, confident tone' },
    { name: 'Daniel', description: 'Clear, natural speech' },
    { name: 'Chris', description: 'Warm, engaging voice' },
  ],
  femaleVoices: [
    { name: 'Rachel', description: 'Professional, articulate' },
    { name: 'Sarah', description: 'Friendly, approachable' },
  ],
}

const UploadForm = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const {userId} = useAuth()

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    
  } = useForm<BookUploadFormData>({
    resolver: zodResolver(bookUploadSchema),
    defaultValues: {
      title: '',
      author: '',
      voice: 'Dave',
    } as any,
  })

  const form = useForm<BookUploadFormValues>({
        resolver: zodResolver(UploadSchema),
        defaultValues: {
            title: '',
            author: '',
            persona: '',
            pdfFile: undefined,
            coverImage: undefined,
        },
    });
  const selectedVoice = watch('voice')

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPdfFile(file)
      setValue('pdfFile', file, { shouldValidate: true })
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      setValue('coverImage', file, { shouldValidate: true })
    }
  }

  const removePdf = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPdfFile(null)
    if (pdfInputRef.current) {
      pdfInputRef.current.value = ''
    }
  }

  const removeCover = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCoverImage(null)
    if (coverInputRef.current) {
      coverInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: BookUploadFormData) => {
    if(!userId){
      return toast.error('You must be logged in to upload a book')
    }
    setIsLoading(true)

    try {
      const existsCheck = await checkBookExists(data.title)
      if(existsCheck.error){
        toast.error('Failed to check if book exists. Please try again.')
        setIsLoading(false)
        return
      }
      if(existsCheck.exists && existsCheck.book){
        toast.error('A book with this title already exists. Please choose a different title.')
        form.reset()
        router.push(`/books/${existsCheck.book.slug}`)
        return
      }
      const fileTitle = data.title.replace(/\s+/g, '-').toLowerCase() // Replace spaces with hyphens
      const pdfFile = data.pdfFile


   
      
      const parsedPDF = await parsePDFFile(pdfFile)
      if(parsedPDF.content.length === 0){
        toast.error('Failed to parse PDF file. Please make sure the file is a valid PDF and try again.')
        setIsLoading(false)
        return
      }

      const  uploadPdfBlob = await upload(fileTitle, pdfFile, {
        access: 'public',
        handleUploadUrl:'/api/upload',
        contentType: 'application/pdf'
      }

      )

      let coverUrl = ''

      if(data.coverImage){
        const coverFile = data.coverImage
        const uploadCoverBlob = await upload(`${fileTitle}_cover.png`, coverFile, {
          access: 'public',
          handleUploadUrl:'/api/upload',
          contentType: coverFile.type
        })
        coverUrl = uploadCoverBlob.url
      }else {
        const reponse = await fetch(parsedPDF.cover)
        const blob = await reponse.blob()
        const uploadedCoverBlob = await upload(`${fileTitle}_cover.png`, blob, {
          access: 'public',
          handleUploadUrl:'/api/upload',
          contentType: blob.type
        })
        coverUrl = uploadedCoverBlob.url
      }

      const book = await createBook({
        clerkId: userId,
        title: data.title, 
        author: data.author,
        persona: data.voice,
        fileURL: uploadPdfBlob.url,
        fileBlobKey: uploadPdfBlob.pathname,
        coverURL: coverUrl ,
        fileSize: pdfFile.size,
      })

      if(!book.success) {
        toast.error(book.error || 'Failed to create a new book')
        setIsLoading(false)
        return
      }

      if(book.alreadyExists){
        toast.error('A book with this title already exists. Please choose a different title.')
        form.reset()
        router.push(`/books/${book.data.slug}`)
        return
      }
      const segments = await saveBookSegments(book.data.id, userId, parsedPDF.content)

      if(!segments.success) {
        toast.error(segments.error || 'Failed to save book segments')
        setIsLoading(false)
        return
      }

        form.reset()
        router.push(`/`)
    } catch (error) {
      console.log('Error uploading book:', error)
      toast.error('Failed to upload book')
    } finally {
      setIsLoading(false)
    }
  
  }

  return (
    <>
      <div className="new-book-wrapper">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* PDF Upload */}
          <div>
            <label className="form-label">PDF File</label>
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf"
              onChange={handlePdfChange}
              className="hidden"
              disabled={isLoading}
            />
            <div
              onClick={() => pdfInputRef.current?.click()}
              className={`upload-dropzone border-2 border-dashed ${
                pdfFile ? 'upload-dropzone-uploaded' : ''
              } ${errors.pdfFile ? 'border-red-500' : 'border-[var(--border-medium)]'}`}
            >
              {!pdfFile ? (
                <>
                  <Upload className="upload-dropzone-icon" />
                  <div className="upload-dropzone-text">Click to upload PDF</div>
                  <div className="upload-dropzone-hint">PDF file (max 50MB)</div>
                </>
              ) : (
                <div className="flex items-center justify-between w-full px-4">
                  <div className="flex items-center gap-3">
                    <Upload className="upload-dropzone-icon" />
                    <div className="text-left">
                      <div className="upload-dropzone-text text-sm">
                        {pdfFile.name}
                      </div>
                      <div className="upload-dropzone-hint text-xs">
                        {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removePdf}
                    className="upload-dropzone-remove"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            {errors.pdfFile && (
              <p className="text-red-500 text-sm mt-2">{errors.pdfFile.message}</p>
            )}
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="form-label">Cover Image</label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />
            <div
              onClick={() => coverInputRef.current?.click()}
              className={`upload-dropzone border-2 border-dashed ${
                coverImage ? 'upload-dropzone-uploaded' : ''
              } ${errors.coverImage ? 'border-red-500' : 'border-[var(--border-medium)]'}`}
            >
              {!coverImage ? (
                <>
                  <Image className="upload-dropzone-icon" />
                  <div className="upload-dropzone-text">Click to upload cover image</div>
                  <div className="upload-dropzone-hint">
                    Leave empty to auto-generate from PDF
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between w-full px-4">
                  <div className="flex items-center gap-3">
                    <Image className="upload-dropzone-icon" />
                    <div className="text-left">
                      <div className="upload-dropzone-text text-sm">
                        {coverImage.name}
                      </div>
                      <div className="upload-dropzone-hint text-xs">
                        {(coverImage.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCover}
                    className="upload-dropzone-remove"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            {errors.coverImage && (
              <p className="text-red-500 text-sm mt-2">{errors.coverImage.message}</p>
            )}
          </div>

          {/* Title Input */}
          <div>
            <label className="form-label">Title</label>
            <input
              {...register('title')}
              type="text"
              placeholder="ex: Rich Dad Poor Dad"
              className={`form-input border-2 ${
                errors.title ? 'border-red-500' : 'border-[var(--border-medium)]'
              }`}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-2">{errors.title.message}</p>
            )}
          </div>

          {/* Author Input */}
          <div>
            <label className="form-label">Author Name</label>
            <input
              {...register('author')}
              type="text"
              placeholder="ex: Robert Kiyosaki"
              className={`form-input border-2 ${
                errors.author ? 'border-red-500' : 'border-[var(--border-medium)]'
              }`}
            />
            {errors.author && (
              <p className="text-red-500 text-sm mt-2">{errors.author.message}</p>
            )}
          </div>

          {/* Voice Selector */}
          <div>
            <label className="form-label">Choose Assistant Voice</label>

            {/* Male Voices */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
                Male Voices
              </h3>
              <div className="voice-selector-options">
                {VOICE_OPTIONS.maleVoices.map((voice) => (
                  <label
                    key={voice.name}
                    className={`voice-selector-option ${
                      selectedVoice === voice.name
                        ? 'voice-selector-option-selected'
                        : 'voice-selector-option-default'
                    } cursor-pointer`}
                  >
                    <input
                      type="radio"
                      {...register('voice')}
                      value={voice.name}
                      className="w-4 h-4"
                    />
                    <div className="text-left">
                      <div className="font-medium text-[var(--text-primary)]">
                        {voice.name}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {voice.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Female Voices */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
                Female Voices
              </h3>
              <div className="voice-selector-options">
                {VOICE_OPTIONS.femaleVoices.map((voice) => (
                  <label
                    key={voice.name}
                    className={`voice-selector-option ${
                      selectedVoice === voice.name
                        ? 'voice-selector-option-selected'
                        : 'voice-selector-option-default'
                    } cursor-pointer`}
                  >
                    <input
                      type="radio"
                      {...register('voice')}
                      value={voice.name}
                      className="w-4 h-4"
                    />
                    <div className="text-left">
                      <div className="font-medium text-[var(--text-primary)]">
                        {voice.name}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {voice.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {errors.voice && (
              <p className="text-red-500 text-sm mt-2">{errors.voice.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="form-btn disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Begin Synthesis'}
          </button>
        </form>
      </div>

      <LoadingOverlay isVisible={isLoading} message="Processing your book..." />
    </>
  )
}

export default UploadForm