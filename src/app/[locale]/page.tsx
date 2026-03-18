import { Link } from "@/i18n/routing";
import { ArrowRight, CheckCircle2, QrCode, Fingerprint, Calculator, FileSpreadsheet, PlayCircle, Users, Sparkles } from "lucide-react";
import Image from "next/image";
import logoPic from '../../../public/assets/logo.webp';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function Home() {
  const t = useTranslations('landing');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 transition-colors duration-300 font-sans selection:bg-indigo-200 selection:text-indigo-900 dark:selection:bg-indigo-900 dark:selection:text-indigo-100 flex flex-col">
      
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-1/4 -right-64 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 -left-64 w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-500/5 blur-[100px] rounded-full" />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 transition-colors">
        <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center -ml-2 invisible md:visible">
            {/* Logo removido del header por petición del usuario */}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
            <Link
              href="/login"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium px-4 py-2 transition-colors hidden sm:block"
            >
              {t('login')}
            </Link>
            <Link
              href="/dashboard"
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-medium shadow-sm hover:shadow-indigo-500/25 active:scale-95 text-sm sm:text-base whitespace-nowrap"
            >
              {t('goToDashboard')}
            </Link>
            {/* Mobile Toggles */}
            <div className="flex sm:hidden items-center gap-1 ml-2">
               <ThemeToggle />
               <LanguageSwitcher />
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative flex-1 w-full max-w-7xl mx-auto px-6 pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center mb-10 group/logo">
            <Link href="/" className="transition-transform duration-500 hover:scale-110">
              <Image 
                src={logoPic} 
                alt="AulaCheck Logo" 
                className="h-24 w-auto object-contain md:h-32 drop-shadow-2xl" 
                priority 
              />
            </Link>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8">
            {t('heroTitle')}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400">
              {t('heroSubtitle')}
            </span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            {t('heroDescription')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl hover:bg-indigo-700 transition-all text-lg font-semibold shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-1"
            >
              {t('startNow')} <ArrowRight className="w-5 h-5 ml-1" />
            </Link>
          </div>
        </div>

        {/* Dashboard Preview / Mock */}
        <div className="mt-24 relative mx-auto max-w-5xl group" style={{ perspective: "1000px" }}>
          <div className="absolute inset-x-0 -bottom-12 h-64 bg-gradient-to-t from-slate-50 dark:from-gray-950 to-transparent z-10" />
          <div className="relative rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl shadow-2xl p-2 sm:p-4 origin-bottom transition-all duration-700 md:rotate-x-12 md:scale-95 group-hover:rotate-x-0 group-hover:scale-100" style={{ transform: "rotateX(12deg)" }}>
            <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
               {/* Browser Header mockup */}
               <div className="bg-gray-100 dark:bg-gray-900 px-4 py-3 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800">
                 <div className="flex gap-1.5">
                   <div className="w-3 h-3 rounded-full bg-red-400" />
                   <div className="w-3 h-3 rounded-full bg-amber-400" />
                   <div className="w-3 h-3 rounded-full bg-green-400" />
                 </div>
               </div>
               {/* Content mockup */}
               <div className="p-6 md:p-10">
                 <div className="flex justify-between items-center mb-6">
                    <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                    <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900 rounded-full" />
                 </div>
                 <div className="space-y-4">
                   {[1, 2, 3].map((i) => (
                     <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
                       <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex-shrink-0" />
                       <div className="flex-1 space-y-2">
                         <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                         <div className="h-3 w-1/4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                       </div>
                       <div className="h-8 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex-shrink-0" />
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative py-24 bg-white dark:bg-gray-900 border-y border-gray-200/50 dark:border-gray-800/50 z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<QrCode className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
              title={t('featureQRTitle')}
              description={t('featureQRDesc')}
            />
            <FeatureCard 
              icon={<Fingerprint className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
              title={t('featureBioTitle')}
              description={t('featureBioDesc')}
            />
            <FeatureCard 
              icon={<Calculator className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
              title={t('featureGradesTitle')}
              description={t('featureGradesDesc')}
            />
            <FeatureCard 
              icon={<FileSpreadsheet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
              title={t('featureExportTitle')}
              description={t('featureExportDesc')}
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative py-24 z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">{t('howItWorksTitle')}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-100 via-indigo-500 to-indigo-100 dark:from-indigo-900/30 dark:via-indigo-500/50 dark:to-indigo-900/30" />
            
            <StepCard number="1" icon={<PlayCircle className="w-8 h-8" />} title={t('step1Title')} description={t('step1Desc')} />
            <StepCard number="2" icon={<Users className="w-8 h-8" />} title={t('step2Title')} description={t('step2Desc')} />
            <StepCard number="3" icon={<CheckCircle2 className="w-8 h-8" />} title={t('step3Title')} description={t('step3Desc')} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden z-20">
        <div className="absolute inset-0 bg-indigo-600 dark:bg-indigo-900" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 dark:opacity-20" />
        <div className="max-w-4xl mx-auto px-6 relative text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            {t('ctaTitle')}
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            {t('ctaDesc')}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-all text-lg font-bold shadow-xl hover:scale-105"
          >
            {t('startNow')} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-950 py-12 border-t border-gray-200 dark:border-gray-900 z-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} AulaCheck. {t('footerRights')}</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-indigo-600 transition-colors">
              {t('terms')}
            </Link>
            <Link href="/privacy" className="hover:text-indigo-600 transition-colors">
              {t('privacyPolicy')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group p-8 rounded-3xl bg-slate-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-xl dark:hover:shadow-indigo-900/10 hover:-translate-y-1 transition-all duration-300">
      <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, icon, title, description }: { number: string, icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="relative text-center">
      <div className="w-24 h-24 mx-auto bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-8 relative z-10 transition-transform duration-300 hover:scale-110">
        {icon}
        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-lg">
          {number}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">{description}</p>
    </div>
  );
}
