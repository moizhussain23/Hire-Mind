import * as pdfParse from 'pdf-parse';
import natural from 'natural';
import { analyzeResume } from './geminiService';

const tokenizer = new natural.WordTokenizer();

interface ParsedResume {
  rawText: string;
  skills: string[];
  experience: string[];
  education: string[];
  projects: string[];
  summary: string;
  contactInfo: {
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
  };
  metadata: {
    totalExperience?: string;
    currentRole?: string;
    education?: string;
  };
}

/**
 * Parse PDF resume and extract structured information
 */
export async function parseResume(pdfBuffer: Buffer): Promise<ParsedResume> {
  try {
    console.log('📄 Parsing resume PDF...');

    // Extract text from PDF
    const pdfData = await (pdfParse as any)(pdfBuffer);
    const rawText = pdfData.text;

    console.log(`✅ PDF parsed: ${rawText.length} characters`);

    // Extract contact information
    const contactInfo = extractContactInfo(rawText);

    // Extract sections using basic NLP
    const sections = extractSections(rawText);

    // Use Gemini AI for advanced analysis
    const aiAnalysis = await analyzeResume(rawText);

    // Combine basic extraction with AI analysis
    const parsedResume: ParsedResume = {
      rawText,
      skills: aiAnalysis.skills.length > 0 ? aiAnalysis.skills : extractSkills(rawText),
      experience: aiAnalysis.experience.length > 0 ? aiAnalysis.experience : sections.experience,
      education: aiAnalysis.education.length > 0 ? aiAnalysis.education : sections.education,
      projects: aiAnalysis.projects.length > 0 ? aiAnalysis.projects : sections.projects,
      summary: aiAnalysis.summary || generateSummary(rawText),
      contactInfo,
      metadata: {
        totalExperience: extractTotalExperience(rawText),
        currentRole: extractCurrentRole(rawText),
        education: sections.education[0] || 'Not specified'
      }
    };

    console.log('✅ Resume parsed successfully');
    console.log(`   - Skills: ${parsedResume.skills.length}`);
    console.log(`   - Experience: ${parsedResume.experience.length}`);
    console.log(`   - Education: ${parsedResume.education.length}`);

    return parsedResume;

  } catch (error: any) {
    console.error('❌ Resume parsing error:', error);
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
}

/**
 * Extract contact information from resume text
 */
function extractContactInfo(text: string): ParsedResume['contactInfo'] {
  const contactInfo: ParsedResume['contactInfo'] = {};

  // Email regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    contactInfo.email = emailMatch[0];
  }

  // Phone regex (various formats)
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    contactInfo.phone = phoneMatch[0];
  }

  // LinkedIn
  const linkedinRegex = /linkedin\.com\/in\/[\w-]+/i;
  const linkedinMatch = text.match(linkedinRegex);
  if (linkedinMatch) {
    contactInfo.linkedin = `https://${linkedinMatch[0]}`;
  }

  // GitHub
  const githubRegex = /github\.com\/[\w-]+/i;
  const githubMatch = text.match(githubRegex);
  if (githubMatch) {
    contactInfo.github = `https://${githubMatch[0]}`;
  }

  return contactInfo;
}

/**
 * Extract sections from resume (Experience, Education, Projects)
 */
function extractSections(text: string): {
  experience: string[];
  education: string[];
  projects: string[];
} {
  const sections = {
    experience: [] as string[],
    education: [] as string[],
    projects: [] as string[]
  };

  // Split by common section headers
  const lines = text.split('\n');
  let currentSection: 'experience' | 'education' | 'projects' | null = null;

  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();

    // Detect section headers
    if (lowerLine.includes('experience') || lowerLine.includes('work history')) {
      currentSection = 'experience';
      continue;
    } else if (lowerLine.includes('education') || lowerLine.includes('academic')) {
      currentSection = 'education';
      continue;
    } else if (lowerLine.includes('project') || lowerLine.includes('portfolio')) {
      currentSection = 'projects';
      continue;
    }

    // Add content to current section
    if (currentSection && line.trim().length > 10) {
      sections[currentSection].push(line.trim());
    }
  }

  return sections;
}

/**
 * Extract skills using keyword matching
 */
function extractSkills(text: string): string[] {
  const commonSkills = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
    'PHP', 'Scala', 'R', 'MATLAB', 'SQL', 'HTML', 'CSS',
    
    // Frameworks & Libraries
    'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET',
    'Laravel', 'Rails', 'Next.js', 'Nuxt.js', 'Svelte', 'jQuery', 'Bootstrap', 'Tailwind',
    
    // Databases
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Cassandra', 'DynamoDB', 'Firebase', 'SQLite',
    
    // Cloud & DevOps
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Git', 'GitHub', 'GitLab',
    'Terraform', 'Ansible', 'Linux', 'Nginx', 'Apache',
    
    // Tools & Others
    'REST API', 'GraphQL', 'WebSocket', 'Microservices', 'Agile', 'Scrum', 'JIRA', 'Figma',
    'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy'
  ];

  const foundSkills: string[] = [];
  const lowerText = text.toLowerCase();

  for (const skill of commonSkills) {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  }

  return [...new Set(foundSkills)]; // Remove duplicates
}

/**
 * Extract total years of experience
 */
function extractTotalExperience(text: string): string {
  const experienceRegex = /(\d+)\+?\s*(years?|yrs?)\s*(of)?\s*(experience|exp)/i;
  const match = text.match(experienceRegex);
  
  if (match) {
    return `${match[1]} years`;
  }

  return 'Not specified';
}

/**
 * Extract current/most recent role
 */
function extractCurrentRole(text: string): string {
  // Look for common job titles
  const jobTitles = [
    'Software Engineer', 'Developer', 'Full Stack', 'Frontend', 'Backend',
    'Data Scientist', 'DevOps', 'Product Manager', 'Designer', 'Analyst',
    'Architect', 'Lead', 'Senior', 'Junior', 'Intern'
  ];

  for (const title of jobTitles) {
    if (text.toLowerCase().includes(title.toLowerCase())) {
      return title;
    }
  }

  return 'Not specified';
}

/**
 * Generate a brief summary from resume text
 */
function generateSummary(text: string): string {
  // Take first few sentences as summary
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const summary = sentences.slice(0, 3).join('. ').trim();
  
  return summary.length > 200 
    ? summary.substring(0, 200) + '...' 
    : summary;
}

/**
 * Validate resume file
 */
export function validateResumeFile(
  file: Express.Multer.File
): { valid: boolean; error?: string } {
  // Check file type
  if (file.mimetype !== 'application/pdf') {
    return {
      valid: false,
      error: 'Only PDF files are allowed'
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 5MB'
    };
  }

  return { valid: true };
}

/**
 * Calculate resume match score for a position
 */
export function calculateMatchScore(
  resumeSkills: string[],
  requiredSkills: string[]
): {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
} {
  const lowerResumeSkills = resumeSkills.map(s => s.toLowerCase());
  const lowerRequiredSkills = requiredSkills.map(s => s.toLowerCase());

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const required of requiredSkills) {
    if (lowerResumeSkills.includes(required.toLowerCase())) {
      matchedSkills.push(required);
    } else {
      missingSkills.push(required);
    }
  }

  const score = requiredSkills.length > 0
    ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
    : 0;

  return {
    score,
    matchedSkills,
    missingSkills
  };
}

export default {
  parseResume,
  validateResumeFile,
  calculateMatchScore
};
