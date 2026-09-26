// frontend/app/contact/page.tsx
import { Mail, MapPin, Phone } from 'lucide-react';

export default function ContactUs() {
  return (
    <div className="min-h-[70vh] max-w-4xl mx-auto py-8 px-4 text-slate-700">
      <div className="bg-white border border-brand-borderLight rounded-3xl p-6 sm:p-8 shadow-card-hover">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-gaming text-slate-900 mb-6 tracking-wider uppercase border-b border-brand-borderLight pb-4 bg-gradient-to-r from-brand-indigo via-brand-violet to-brand-teal bg-clip-text text-transparent">
          Contact Us
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-600">
            <p>
              Have a question, facing an issue with a tournament, or need help with a payout? Our dedicated support team is here to help you get back into the game.
            </p>
            <p>
              Please allow up to 24 hours for our team to respond to your queries.
            </p>
          </div>

          <div className="bg-slate-50 border border-brand-borderLight p-6 rounded-2xl space-y-4 shadow-card-subtle">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-brand-indigo flex-shrink-0">
                <Mail size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-gaming">Email Support</h3>
                <p className="text-xs text-slate-500 mt-0.5">support@vpsesportshub.com</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-brand-indigo flex-shrink-0">
                <Phone size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-gaming">Phone</h3>
                <p className="text-xs text-slate-500 mt-0.5">+91 98765 43210</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-brand-indigo flex-shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-gaming">Registered Office</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  VPS EsportsHub HQ<br/>
                  Pune, Maharashtra, 411001<br/>
                  India
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}