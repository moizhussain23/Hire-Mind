import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export const uploadResume = async (file: Buffer, fileName: string): Promise<string> => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          public_id: `resumes/${fileName}`,
          folder: 'ai-interview-platform/resumes',
          format: 'pdf'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(error)
          } else {
            resolve(result?.secure_url || '')
          }
        }
      )

      const readable = new Readable()
      readable.push(file)
      readable.push(null)
      readable.pipe(uploadStream)
    })
  } catch (error) {
    console.error('Error uploading resume:', error)
    throw error
  }
}

export const uploadInterviewRecording = async (file: Buffer, interviewId: string): Promise<string> => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          public_id: `recordings/${interviewId}`,
          folder: 'ai-interview-platform/recordings',
          format: 'mp4'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(error)
          } else {
            resolve(result?.secure_url || '')
          }
        }
      )

      const readable = new Readable()
      readable.push(file)
      readable.push(null)
      readable.pipe(uploadStream)
    })
  } catch (error) {
    console.error('Error uploading recording:', error)
    throw error
  }
}

export const uploadReport = async (file: Buffer, interviewId: string): Promise<string> => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          public_id: `reports/${interviewId}`,
          folder: 'ai-interview-platform/reports',
          format: 'pdf'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(error)
          } else {
            resolve(result?.secure_url || '')
          }
        }
      )

      const readable = new Readable()
      readable.push(file)
      readable.push(null)
      readable.pipe(uploadStream)
    })
  } catch (error) {
    console.error('Error uploading report:', error)
    throw error
  }
}

export const deleteFile = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}
