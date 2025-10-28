import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Touch</span>
          </h1>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Have questions about our AI interview platform? We're here to help you revolutionize your hiring process.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Email Us</h3>
                    <p className="text-white/70">support@hiremind.ai</p>
                    <p className="text-white/70">sales@hiremind.ai</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Phone className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Call Us</h3>
                    <p className="text-white/70">+1 (555) 123-4567</p>
                    <p className="text-white/70">Mon-Fri 9AM-6PM EST</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Visit Us</h3>
                    <p className="text-white/70">123 Innovation Drive</p>
                    <p className="text-white/70">San Francisco, CA 94105</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Response Time</h3>
                    <p className="text-white/70">We typically respond within</p>
                    <p className="text-white/70">24 hours during business days</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Links */}
            <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Quick Links</h2>
              <div className="space-y-4">
                <a 
                  href="https://ai.flocareer.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 text-white/70 hover:text-blue-400 transition-colors group"
                >
                  <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Try AI Interview Demo</span>
                </a>
                <a 
                  href="/privacy" 
                  className="flex items-center space-x-3 text-white/70 hover:text-blue-400 transition-colors group"
                >
                  <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Privacy Policy</span>
                </a>
                <a 
                  href="/terms" 
                  className="flex items-center space-x-3 text-white/70 hover:text-blue-400 transition-colors group"
                >
                  <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>Terms & Conditions</span>
                </a>
              </div>
            </Card>
          </div>

          {/* Contact Form */}
          <div>
            <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                      Full Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:ring-blue-400"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:ring-blue-400"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-white/80 mb-2">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:ring-blue-400"
                    placeholder="What's this about?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-white/80 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Send Message</span>
                </Button>
              </form>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <Card className="p-8 bg-white/5 backdrop-blur-sm border-white/10">
            <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">How does the AI interview work?</h3>
                <p className="text-white/70">
                  Our AI interviewer conducts real-time, voice-led interviews that simulate human conversations. 
                  It asks relevant questions, listens to responses, and provides follow-up questions based on the candidate's answers.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">What types of roles can be interviewed?</h3>
                <p className="text-white/70">
                  Our platform supports interviews for various roles including software engineering, sales, 
                  marketing, operations, and more. The AI adapts questions based on the job description and candidate's background.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">How accurate are the evaluations?</h3>
                <p className="text-white/70">
                  Our AI uses advanced natural language processing and machine learning to provide 
                  comprehensive evaluations with detailed insights into candidate performance and skills.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Is there a free trial available?</h3>
                <p className="text-white/70">
                  Yes! We offer a free trial so you can experience our AI interview platform. 
                  Contact us to learn more about our trial options and pricing plans.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contact;
