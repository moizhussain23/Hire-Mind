export interface User {
  id: string
  clerkId: string
  email: string
  firstName: string
  lastName: string
  role: 'candidate' | 'hr' | 'admin'
  profileImage?: string
  resumeUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserRequest {
  clerkId: string
  email: string
  firstName: string
  lastName: string
  role?: 'candidate' | 'hr' | 'admin'
  profileImage?: string
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  profileImage?: string
  resumeUrl?: string
}
