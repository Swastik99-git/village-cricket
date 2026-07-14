import { ChevronLeft, Target, Eye, MessageCircle, Mail, Github, Instagram } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function AboutFounder() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="page-container">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4 hover:text-cricket-600 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">About the Founder</h1>

        {/* Founder Card */}
        <div className="card p-6 mb-5 text-center">
          <img
            src="../public/images/profile_swastik.jpeg"
            alt="Swastik Biswal"
            className="w-24 h-24 rounded-full object-cover ring-4 ring-cricket-100 dark:ring-gray-700 mx-auto mb-4"
          />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Swastik Biswal</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Founder & Developer</p>
        </div>

        {/* Short Bio */}
        <div className="card p-5 mb-5">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Introduction</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            This platform was created to organize village cricket, preserve every memorable match,
            and maintain accurate player statistics for our local community.
          </p>
        </div>

        {/* Mission */}
        <div className="card p-5 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-cricket-50 dark:bg-gray-800 flex items-center justify-center text-cricket-600 dark:text-cricket-400">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Mission</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            To bring structure and transparency to village cricket by providing an easy-to-use platform
            where every player, match, and performance is recorded and celebrated. To make cricket
            management accessible to everyone, regardless of technical skill.
          </p>
        </div>

        {/* Vision */}
        <div className="card p-5 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-cricket-50 dark:bg-gray-800 flex items-center justify-center text-cricket-600 dark:text-cricket-400">
              <Eye className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Vision</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            To build a connected community of village cricket players where every match is remembered,
            every player's contribution is recognized, and the spirit of local cricket thrives for
            generations to come.
          </p>
        </div>

        {/* Contact Buttons */}
        <div>
          <h3 className="section-title mb-3">Get in Touch</h3>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="https://wa.me/917609065467"
              target="_blank"
              rel="noopener noreferrer"
              className="card p-4 flex flex-col items-center gap-2 hover:shadow-card-hover transition-all active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">WhatsApp</span>
            </a>
            <a
              href="https://www.instagram.com/__the_dimple_guy___/?hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="card p-4 flex flex-col items-center gap-2 hover:shadow-card-hover transition-all active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center text-pink-600 dark:text-pink-400">
                <Instagram className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Instagram</span>
            </a>
            <a
              href="mailto:swastikbiswal18@gmail.com"
              className="card p-4 flex flex-col items-center gap-2 hover:shadow-card-hover transition-all active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Email</span>
            </a>
            <a
              href="https://github.com/Swastik99-git"
              target="_blank"
              rel="noopener noreferrer"
              className="card p-4 flex flex-col items-center gap-2 hover:shadow-card-hover transition-all active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300">
                <Github className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
