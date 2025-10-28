import React from 'react';
import { Shield, Eye, Lock, Database, Users, Globe } from 'lucide-react';
import Card from '../components/ui/Card';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Policy</span>
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-white/50 mt-4">
            Last updated: January 2025
          </p>
        </div>

        {/* Introduction */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
          <p className="text-white/70 leading-relaxed">
            HireMind ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
            how we collect, use, disclose, and safeguard your information when you use our AI interview platform 
            and related services (collectively, the "Service").
          </p>
        </Card>

        {/* Information We Collect */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Database className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Information We Collect</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Personal Information</h3>
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li>Name, email address, and contact information</li>
                <li>Professional information (resume, work experience, skills)</li>
                <li>Interview responses and evaluation data</li>
                <li>Account credentials and authentication data</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Technical Information</h3>
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li>IP address, browser type, and device information</li>
                <li>Usage patterns and platform interactions</li>
                <li>Video and audio recordings during interviews</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* How We Use Information */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Eye className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">How We Use Your Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Service Delivery</h3>
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li>Conduct AI-powered interviews</li>
                <li>Generate evaluation reports</li>
                <li>Provide candidate management tools</li>
                <li>Enable communication between parties</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Platform Improvement</h3>
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li>Enhance AI interview capabilities</li>
                <li>Improve user experience</li>
                <li>Develop new features</li>
                <li>Analyze usage patterns</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Data Security */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Lock className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Data Security</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-white/70 leading-relaxed">
              We implement industry-standard security measures to protect your information:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Technical Safeguards</h3>
                <ul className="list-disc list-inside space-y-2 text-white/70">
                  <li>End-to-end encryption for data transmission</li>
                  <li>Secure cloud infrastructure (AWS)</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Administrative Safeguards</h3>
                <ul className="list-disc list-inside space-y-2 text-white/70">
                  <li>Employee training on data protection</li>
                  <li>Strict access controls and monitoring</li>
                  <li>Incident response procedures</li>
                  <li>Regular compliance assessments</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Data Sharing */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Users className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Information Sharing</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-white/70 leading-relaxed">
              We do not sell, trade, or rent your personal information. We may share information in the following circumstances:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li><strong>With Employers:</strong> Interview results and evaluations with authorized hiring organizations</li>
              <li><strong>Service Providers:</strong> Trusted third parties who assist in platform operations</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
              <li><strong>Consent:</strong> When you explicitly consent to sharing</li>
            </ul>
          </div>
        </Card>

        {/* Your Rights */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Globe className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-bold text-white">Your Rights</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Access & Control</h3>
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li>Access your personal information</li>
                <li>Update or correct your data</li>
                <li>Delete your account and data</li>
                <li>Export your information</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Communication</h3>
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li>Opt-out of marketing communications</li>
                <li>Control notification preferences</li>
                <li>Request data processing restrictions</li>
                <li>Object to certain data uses</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Cookies */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Cookies and Tracking</h2>
          <div className="space-y-4">
            <p className="text-white/70 leading-relaxed">
              We use cookies and similar technologies to enhance your experience, analyze usage, and provide personalized content.
            </p>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Types of Cookies</h3>
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li><strong>Essential:</strong> Required for platform functionality</li>
                <li><strong>Analytics:</strong> Help us understand user behavior</li>
                <li><strong>Preferences:</strong> Remember your settings and choices</li>
                <li><strong>Marketing:</strong> Provide relevant content and ads</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* International Transfers */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">International Data Transfers</h2>
          <p className="text-white/70 leading-relaxed">
            Your information may be transferred to and processed in countries other than your own. 
            We ensure appropriate safeguards are in place to protect your data in accordance with 
            applicable privacy laws, including standard contractual clauses and adequacy decisions.
          </p>
        </Card>

        {/* Children's Privacy */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Children's Privacy</h2>
          <p className="text-white/70 leading-relaxed">
            Our Service is not intended for individuals under 18 years of age. We do not knowingly 
            collect personal information from children under 18. If we become aware that we have 
            collected personal information from a child under 18, we will take steps to delete such information.
          </p>
        </Card>

        {/* Changes to Policy */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Changes to This Policy</h2>
          <p className="text-white/70 leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any material 
            changes by posting the new Privacy Policy on this page and updating the "Last updated" date. 
            Your continued use of the Service after any modifications constitutes acceptance of the updated policy.
          </p>
        </Card>

        {/* Contact Information */}
        <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
          <div className="space-y-4">
            <p className="text-white/70 leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Email</h3>
                <p className="text-white/70">privacy@hiremind.ai</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Address</h3>
                <p className="text-white/70">
                  HireMind Privacy Team<br />
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

export default Privacy;
