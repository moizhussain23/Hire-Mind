import React from 'react';
import { FileText, Scale, AlertTriangle, Users, Shield, Globe } from 'lucide-react';
import Card from '../components/ui/Card';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Terms & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Conditions</span>
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Please read these terms carefully before using our AI interview platform.
          </p>
          <p className="text-sm text-white/50 mt-4">
            Last updated: January 2025
          </p>
        </div>

        {/* Introduction */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Agreement to Terms</h2>
          <p className="text-white/70 leading-relaxed">
            By accessing and using HireMind's AI interview platform ("Service"), you agree to be bound by these 
            Terms and Conditions ("Terms"). If you do not agree to these Terms, please do not use our Service.
          </p>
        </Card>

        {/* Service Description */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Users className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Service Description</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-white/70 leading-relaxed">
              HireMind provides an AI-powered interview platform that enables:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>Real-time AI-conducted interviews with voice and video capabilities</li>
              <li>Automated evaluation and scoring of candidate responses</li>
              <li>Interview management and candidate tracking tools</li>
              <li>Report generation and analytics for hiring decisions</li>
              <li>Integration with third-party hiring and HR systems</li>
            </ul>
          </div>
        </Card>

        {/* User Accounts */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">User Accounts</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Account Creation</h3>
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You must be at least 18 years old to use our Service</li>
                <li>One person may not maintain multiple accounts</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Account Responsibilities</h3>
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Acceptable Use */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Acceptable Use Policy</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Permitted Uses</h3>
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li>Conducting legitimate job interviews and candidate evaluations</li>
                <li>Using the Service for lawful business purposes</li>
                <li>Complying with all applicable laws and regulations</li>
                <li>Respecting the privacy and rights of all users</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Prohibited Activities</h3>
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li>Attempting to circumvent security measures or access controls</li>
                <li>Using the Service for fraudulent, deceptive, or illegal purposes</li>
                <li>Interfering with the proper functioning of the platform</li>
                <li>Harassing, threatening, or discriminating against other users</li>
                <li>Sharing false or misleading information during interviews</li>
                <li>Attempting to reverse engineer or copy our technology</li>
                <li>Using automated tools to access the Service without permission</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Interview Conduct */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Interview Conduct</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">For Candidates</h3>
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li>Provide honest and accurate responses to interview questions</li>
                <li>Maintain professional behavior throughout the interview process</li>
                <li>Do not attempt to cheat or use unauthorized assistance</li>
                <li>Respect the interview time limits and technical requirements</li>
                <li>Ensure you have a stable internet connection and working equipment</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">For Employers</h3>
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li>Use interview results fairly and in compliance with employment laws</li>
                <li>Provide clear job descriptions and requirements</li>
                <li>Respect candidate privacy and confidentiality</li>
                <li>Do not discriminate based on protected characteristics</li>
                <li>Use the evaluation data responsibly and ethically</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Intellectual Property */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Scale className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Intellectual Property</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Our Rights</h3>
              <p className="text-white/70 leading-relaxed">
                The Service, including its design, functionality, and content, is owned by HireMind and protected 
                by intellectual property laws. You may not copy, modify, distribute, or create derivative works 
                without our express written permission.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Your Content</h3>
              <p className="text-white/70 leading-relaxed">
                You retain ownership of content you provide (resumes, responses, etc.), but grant us a license 
                to use, process, and store this content to provide the Service. We may use anonymized data 
                to improve our AI models and platform functionality.
              </p>
            </div>
          </div>
        </Card>

        {/* Privacy and Data */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Privacy and Data Protection</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-white/70 leading-relaxed">
              Your privacy is important to us. Our collection, use, and protection of your information 
              is governed by our Privacy Policy, which is incorporated into these Terms by reference.
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>We implement industry-standard security measures to protect your data</li>
              <li>Interview recordings and data are stored securely and used only for evaluation purposes</li>
              <li>We comply with applicable data protection laws and regulations</li>
              <li>You have rights regarding your personal information as described in our Privacy Policy</li>
            </ul>
          </div>
        </Card>

        {/* Payment Terms */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Payment Terms</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Fees and Billing</h3>
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                <li>All fees are non-refundable unless otherwise specified</li>
                <li>We may change our pricing with 30 days' notice</li>
                <li>You are responsible for all applicable taxes</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Cancellation</h3>
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li>You may cancel your subscription at any time</li>
                <li>Cancellation takes effect at the end of your current billing period</li>
                <li>No refunds are provided for partial billing periods</li>
                <li>We may suspend or terminate accounts for non-payment</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Disclaimers */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Disclaimers and Limitations</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Service Availability</h3>
              <p className="text-white/70 leading-relaxed">
                We strive to maintain high service availability but cannot guarantee uninterrupted access. 
                The Service is provided "as is" without warranties of any kind.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">AI Limitations</h3>
              <p className="text-white/70 leading-relaxed">
                While our AI technology is advanced, it may not be perfect. Interview evaluations should 
                be used as one factor in hiring decisions, not as the sole basis for employment decisions.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Limitation of Liability</h3>
              <p className="text-white/70 leading-relaxed">
                To the maximum extent permitted by law, HireMind shall not be liable for any indirect, 
                incidental, special, or consequential damages arising from your use of the Service.
              </p>
            </div>
          </div>
        </Card>

        {/* Termination */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Termination</h2>
          
          <div className="space-y-4">
            <p className="text-white/70 leading-relaxed">
              Either party may terminate this agreement at any time. Upon termination:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>Your right to use the Service will cease immediately</li>
              <li>We may delete your account and associated data</li>
              <li>Certain provisions of these Terms will survive termination</li>
              <li>You remain responsible for any outstanding fees</li>
            </ul>
          </div>
        </Card>

        {/* Governing Law */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Globe className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-bold text-white">Governing Law</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-white/70 leading-relaxed">
              These Terms are governed by the laws of the State of Delaware, without regard to conflict of law principles. 
              Any disputes arising from these Terms or your use of the Service will be resolved through binding arbitration 
              in accordance with the rules of the American Arbitration Association.
            </p>
          </div>
        </Card>

        {/* Changes to Terms */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Changes to Terms</h2>
          <p className="text-white/70 leading-relaxed">
            We may update these Terms from time to time. We will notify you of any material changes by posting 
            the updated Terms on our website and updating the "Last updated" date. Your continued use of the 
            Service after such changes constitutes acceptance of the updated Terms.
          </p>
        </Card>

        {/* Contact Information */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
          <div className="space-y-4">
            <p className="text-white/70 leading-relaxed">
              If you have any questions about these Terms and Conditions, please contact us:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Email</h3>
                <p className="text-white/70">legal@hiremind.ai</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Address</h3>
                <p className="text-white/70">
                  HireMind Legal Team<br />
                  123 Innovation Drive<br />
                  San Francisco, CA 94105
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
